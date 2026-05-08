import hashlib
import time
from datetime import date

from django.db import transaction
from rest_framework import generics, status, serializers
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
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
        if user.role == 'admin':
            return Bid.objects.select_related('project', 'supplier').all().order_by('-submitted_at')
        return Bid.objects.filter(supplier=user).select_related('project', 'supplier').order_by('-submitted_at')

    def perform_create(self, serializer):
        project_id = self.request.data.get("project")
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            raise serializers.ValidationError({"project": "Project not found."})

        if project.status != Project.Status.ACTIVE or project.deadline < date.today():
            raise serializers.ValidationError({"project": "Bidding closed for this project."})

        if Bid.objects.filter(project=project, supplier=self.request.user).exists():
            raise serializers.ValidationError({"project": "You have already submitted a bid for this project."})

        serializer.save(
            supplier=self.request.user,
            company_name=self.request.user.company_name,
        )
        log_audit("SUBMIT_BID", self.request.user, f"Submitted bid for {project.title}", "bid", project.id)
        recalculate_project_ranks(project)


class BidDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = BidSerializer
    queryset = Bid.objects.all()

    def perform_update(self, serializer):
        bid = serializer.save()
        log_audit("UPDATE", self.request.user, f"Updated evaluation for bid {bid.id}", "bid", bid.id)


class MarkUnderReviewView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            bid = Bid.objects.get(pk=pk)
            bid.status = Bid.Status.UNDER_REVIEW
            bid.save(update_fields=['status', 'updated_at'])
            log_audit("UPDATE", request.user, f"Marked bid {bid.id} under review", "bid", bid.id)
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
                Bid.objects.filter(project=bid.project).exclude(pk=pk).update(status=Bid.Status.REJECTED)
                bid.status = Bid.Status.SELECTED
                bid.save(update_fields=['status', 'updated_at'])
                Project.objects.filter(pk=bid.project.pk).update(status=Project.Status.AWARDED)
                recalculate_project_ranks(bid.project)
                log_audit("SELECT_WINNER", request.user, f"Selected winner for {bid.project.title}: {bid.supplier.full_name}", "bid", bid.id)

            return Response(BidSerializer(bid).data)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found'}, status=status.HTTP_404_NOT_FOUND)


class RecordToBlockchainView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk, status=Bid.Status.SELECTED)

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

            return Response(BlockchainRecordSerializer(record).data, status=status.HTTP_201_CREATED)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)


class NoticeOfAwardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk, status=Bid.Status.SELECTED)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)

        return Response(build_award_document_payload(bid, 'Notice of Award'))


class NoticeToProceedView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk, status=Bid.Status.SELECTED)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)

        return Response(build_award_document_payload(bid, 'Notice to Proceed'))


class ResolutionToAwardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk, status=Bid.Status.SELECTED)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)

        return Response(build_award_document_payload(bid, 'Resolution to Award'))
