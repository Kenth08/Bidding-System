import hashlib
import time

from django.db import IntegrityError
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Bid
from .serializers import BidSerializer
from apps.blockchain.models import BlockchainRecord
from apps.blockchain.serializers import BlockchainRecordSerializer
from apps.users.permissions import IsAdmin, IsSupplier
from apps.projects.models import Project
from apps.projects.audit import log_audit
from apps.projects.utils import close_expired_projects
from apps.notifications.utils import create_notification, notify_admins, notify_user


def recalculate_project_ranks(project):
    bids = list(Bid.objects.filter(project=project).order_by("bid_amount", "submitted_at", "id"))
    for index, bid in enumerate(bids, start=1):
        if bid.rank != index:
            Bid.objects.filter(pk=bid.pk).update(rank=index)


def build_award_document_payload(bid, document_type):
    project = bid.project
    savings = None
    if project.budget is not None and bid.bid_amount is not None:
        savings = max(float(project.budget) - float(bid.bid_amount), 0)

    reference_map = {
        "Notice of Award": f"NOA-{str(project.id)[:8].upper()}",
        "Notice to Proceed": f"NTP-{str(project.id)[:8].upper()}",
        "Resolution to Award": f"RES-{str(project.id)[:8].upper()}",
    }

    return {
        "document_type": document_type,
        "reference": reference_map.get(document_type, f"DOC-{str(project.id)[:8].upper()}"),
        "project_title": project.title,
        "procurement_type": project.procurement_type,
        "supplier_name": bid.supplier.full_name,
        "company_name": bid.company_name or bid.supplier.company_name,
        "bid_amount": float(bid.bid_amount),
        "budget": float(project.budget or 0),
        "award_date": bid.updated_at.date(),
        "proceed_date": bid.updated_at.date(),
        "resolution_date": bid.updated_at.date(),
        "delivery_period": project.delivery_period,
        "savings": savings,
    }


class BidListCreateView(generics.ListCreateAPIView):
    serializer_class = BidSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSupplier()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Bid.objects.select_related('project', 'supplier').all()
        project_id = self.request.query_params.get("project")
        supplier_filter = self.request.query_params.get("supplier")

        if getattr(user, "role", None) == "admin":
            if project_id:
                queryset = queryset.filter(project_id=project_id)
            return queryset.order_by("project__title", "bid_amount", "submitted_at")

        if getattr(user, "role", None) == "supplier":
            queryset = queryset.filter(supplier=user)
            if supplier_filter == "me" or not supplier_filter:
                return queryset.order_by("-submitted_at")
            return queryset.order_by("-submitted_at")

        return Bid.objects.none()

    def _get_project_from_request(self):
        project_id = self.request.data.get("project") or self.request.data.get("project_id")
        try:
            return Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            raise serializers.ValidationError({"project": "Project not found."})

    def _reject_if_closed(self, project):
        today = timezone.localdate()
        if project.deadline and project.deadline < today:
            if project.status == Project.Status.ACTIVE:
                project.status = Project.Status.CLOSED
                project.save(update_fields=["status", "updated_at"])
            raise PermissionDenied(detail={"project": "Bidding is closed for this project."})
        if project.status != Project.Status.ACTIVE:
            raise PermissionDenied(detail={"project": "Bidding is closed for this project."})

    def perform_create(self, serializer):
        # Ensure expired projects are closed before allowing submissions
        close_expired_projects()

        project = self._get_project_from_request()
        # Final check: reject if the project is closed or already awarded
        if project.status in [Project.Status.AWARDED, Project.Status.CLOSED]:
            raise PermissionDenied(detail={"project": "Bidding for this project is closed and no longer accepting submissions."})
        # Enforce explicit deadline check
        today = timezone.localdate()
        if project.deadline and today > project.deadline:
            raise PermissionDenied(detail={"error": f"Bidding is closed. The deadline was {project.deadline}."})

        self._reject_if_closed(project)

        if Bid.objects.filter(project=project, supplier=self.request.user).exists():
            raise serializers.ValidationError({"project": "You have already submitted a bid for this project."})

        try:
            bid = serializer.save(
                supplier=self.request.user,
                company_name=self.request.user.company_name,
                status=Bid.Status.SUBMITTED,
            )
        except IntegrityError:
            raise serializers.ValidationError({"project": "You have already submitted a bid for this project."})

        log_audit("SUBMIT_BID", self.request.user, f"Submitted bid for {project.title}", "bid", project.id)
        notify_admins(
            notification_type="new_bid",
            title="New Bid Submitted",
            message=f'{self.request.user.company_name or self.request.user.full_name} submitted a bid of ₱{bid.bid_amount:,.2f} on {project.title}.',
            link=f'/admin/bid-evaluation?project={project.id}',
            related_id=str(bid.id),
        )
        recalculate_project_ranks(project)
        return bid


class BidDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = BidSerializer
    queryset = Bid.objects.all()

    def perform_update(self, serializer):
        bid_instance = self.get_object()
        if bid_instance.project.status == Project.Status.AWARDED:
            raise PermissionDenied(detail={"error": "Bids for awarded projects cannot be modified."})
        bid = serializer.save()
        proj_title = bid.project.title if getattr(bid, 'project', None) else 'Unknown Project'
        supplier_name = bid.supplier.full_name if getattr(bid, 'supplier', None) else 'Unknown Supplier'
        log_audit("UPDATE", self.request.user, f"Updated evaluation for bid for {proj_title} by {supplier_name}", "bid", bid.id)


class BidPublicCountView(APIView):
    """Public endpoint that exposes only aggregate bid count."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"count": Bid.objects.count()})


class MarkUnderReviewView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            bid = Bid.objects.get(pk=pk)
            bid.status = Bid.Status.UNDER_EVALUATION
            bid.save(update_fields=['status', 'updated_at'])
            proj_title = bid.project.title if getattr(bid, 'project', None) else 'Unknown Project'
            supplier_name = bid.supplier.full_name if getattr(bid, 'supplier', None) else 'Unknown Supplier'
            log_audit("UPDATE", request.user, f"Marked bid from {supplier_name} for {proj_title} under review", "bid", bid.id)
            recalculate_project_ranks(bid.project)
            return Response(BidSerializer(bid).data)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found'}, status=status.HTTP_404_NOT_FOUND)


class SelectWinnerView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk)

            with transaction.atomic():
                if bid.project.status == Project.Status.AWARDED:
                    return Response(
                        {'error': 'Bidding is already completed for this project. A winner has already been selected.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                existing_winner = Bid.objects.filter(project=bid.project, status=Bid.Status.WON).exclude(pk=bid.pk).first()
                if existing_winner:
                    return Response(
                        {'error': 'Bidding is already completed for this project. A winner has already been selected.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                Bid.objects.filter(project=bid.project).exclude(pk=pk).update(status=Bid.Status.LOST)
                bid.status = Bid.Status.WON
                bid.save(update_fields=['status', 'updated_at'])
                Project.objects.filter(pk=bid.project.pk).update(status=Project.Status.AWARDED, awarded_at=timezone.now())

                if not BlockchainRecord.objects.filter(project=bid.project).exists():
                    raw = f"{bid.project.id}{bid.supplier.id}{bid.bid_amount}{time.time()}"
                    hash_value = '0x' + hashlib.sha256(raw.encode()).hexdigest()
                    project_ref = f"PRJ-{str(bid.project.id)[:6].upper()}"
                    BlockchainRecord.objects.create(
                        project=bid.project,
                        bid=bid,
                        winner=bid.supplier,
                        bid_amount=bid.bid_amount,
                        hash=hash_value,
                        project_ref_id=project_ref,
                    )
                    bid.recorded = True
                    bid.save(update_fields=['recorded', 'updated_at'])

                recalculate_project_ranks(bid.project)
                log_audit("SELECT_WINNER", request.user, f"Selected winner for {bid.project.title}: {bid.supplier.full_name}", "bid", bid.id)

            notify_user(
                user=bid.supplier,
                notification_type="bid_won",
                title="Congratulations! Your Bid Won",
                message=f'Your bid of ₱{bid.bid_amount:,.2f} was selected as the winner for {bid.project.title}.',
                link="/supplier/bids",
                related_id=str(bid.id),
            )
            losing_bids = Bid.objects.select_related('supplier', 'project').filter(project=bid.project).exclude(pk=bid.pk)
            for losing_bid in losing_bids:
                notify_user(
                    user=losing_bid.supplier,
                    notification_type="bid_lost",
                    title="Bid Result",
                    message=f'Your bid for {bid.project.title} was not selected. Thank you for participating.',
                    link="/supplier/bids",
                    related_id=str(losing_bid.id),
                )
            return Response(BidSerializer(bid).data)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found'}, status=status.HTTP_404_NOT_FOUND)


class RecordToBlockchainView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk, status=Bid.Status.WON)

            if bid.recorded:
                return Response({'error': 'Already recorded on blockchain'}, status=status.HTTP_400_BAD_REQUEST)

            raw = f"{bid.project.id}{bid.supplier.id}{bid.bid_amount}{time.time()}"
            hash_value = '0x' + hashlib.sha256(raw.encode()).hexdigest()
            project_ref = f"PRJ-{str(bid.project.id)[:6].upper()}"

            record = BlockchainRecord.objects.create(
                project=bid.project,
                bid=bid,
                winner=bid.supplier,
                bid_amount=bid.bid_amount,
                hash=hash_value,
                project_ref_id=project_ref,
            )

            bid.recorded = True
            bid.save(update_fields=['recorded', 'updated_at'])
            log_audit("RECORD_BLOCKCHAIN", request.user, f"Recorded blockchain entry for {bid.project.title}", "blockchain", record.id)
            notify_admins(
                notification_type="blockchain_recorded",
                title="Blockchain Record Saved",
                message=f'"{bid.project.title}" award for {bid.supplier.full_name} has been permanently recorded on the blockchain.',
            )

            return Response(BlockchainRecordSerializer(record).data, status=status.HTTP_201_CREATED)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)


class NoticeOfAwardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk, status=Bid.Status.WON)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)

        return Response(build_award_document_payload(bid, 'Notice of Award'))


class NoticeToProceedView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk, status=Bid.Status.WON)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)

        return Response(build_award_document_payload(bid, 'Notice to Proceed'))


class ResolutionToAwardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk, status=Bid.Status.WON)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)

        return Response(build_award_document_payload(bid, 'Resolution to Award'))
