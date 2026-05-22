from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from .models import Project, Procurement, AuditLog, DocumentUpload
from .utils import auto_publish_scheduled_projects, close_expired_projects
from .serializers import (
    ProjectSerializer,
    ProcurementSerializer,
    AuditLogSerializer,
    DocumentUploadSerializer,
    REQUEST_STATUS_TO_API,
)
from .services import (
    apply_review_action,
    archive_project,
    get_review_block_reason,
    notify_request_review,
    publish_project,
    unarchive_project,
)
from apps.bids.models import Bid
from apps.blockchain.models import BlockchainRecord
from apps.users.permissions import IsAdmin, IsAdminOrSchoolHead, IsSchoolHead
from apps.projects.audit import log_audit
from apps.notifications.utils import create_notification, notify_school_heads

User = get_user_model()


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        today = timezone.localdate()
        auto_publish_scheduled_projects()
        close_expired_projects()
        queryset = Project.objects.select_related("created_by", "procurement_request").prefetch_related("bids").filter(is_archived=False).order_by("-created_at")

        if getattr(user, "role", None) == "supplier" and getattr(user, "status", None) not in {"approved", "active"}:
            return Project.objects.none()

        if getattr(user, "role", None) == "supplier":
            queryset = queryset.filter(status=Project.Status.ACTIVE, deadline__gte=today)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        # Force new projects to be created as Draft regardless of incoming payload
        project = serializer.save(created_by=self.request.user, status=Project.Status.DRAFT)
        log_audit("CREATE", self.request.user, f"Created project {project.title}", "project", project.id)


class PublishProjectView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        if project.status in {Project.Status.ACTIVE, Project.Status.CLOSED, Project.Status.AWARDED}:
            return Response({"error": "This project has been published and cannot be edited or deleted."}, status=403)

        if project.status != Project.Status.DRAFT:
            return Response({"detail": "Only draft projects can be published."}, status=400)

        publish_project(project, request.user)
        try:
            approved_suppliers = User.objects.filter(role="supplier", status="approved", is_active=True)
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@example.com")
            for supplier in approved_suppliers:
                try:
                    send_mail(
                        subject="New Bidding Opportunity Available",
                        message=(
                            f'A new project "{project.title}" is now open for bidding.\n\n'
                            f'Budget: ₱{project.budget}\nDeadline: {project.deadline}\n\n'
                            'Login to view and submit your bid: http://localhost:5174'
                        ),
                        from_email=from_email,
                        recipient_list=[supplier.email],
                        fail_silently=True,
                    )
                except Exception:
                    continue
        except Exception:
            pass
        return Response(ProjectSerializer(project, context={"request": request}).data)


def _request_to_api_status(value):
    return REQUEST_STATUS_TO_API.get(value, "pending_review")


class ProcurementRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = ProcurementSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAdminOrSchoolHead()]

    def get_queryset(self):
        user = self.request.user
        queryset = Procurement.objects.all().order_by('-created_at')
        if getattr(user, "role", None) == "supplier":
            return Procurement.objects.none()
        if getattr(user, "role", None) == "admin":
            return queryset.filter(created_by=user)
        return queryset

    def perform_create(self, serializer):
        deadline = serializer.validated_data.get("deadline")
        if not deadline:
            deadline = timezone.localdate() + timedelta(days=14)
        request_item = serializer.save(
            created_by=self.request.user,
            status=Procurement.Status.PENDING_REVIEW,
            review_remarks="",
            deadline=deadline,
        )
        log_audit("CREATE", self.request.user, f"Created procurement request {request_item.project_title}", "procurement", request_item.id)
        notify_school_heads(
            notification_type="procurement_request",
            title="New Procurement Request",
            message=f'Admin submitted a new procurement request: {request_item.project_title}.',
            link="/school-head/requests",
            related_id=str(request_item.id),
        )


class ProcurementRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProcurementSerializer
    queryset = Procurement.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrSchoolHead()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = Procurement.objects.all()
        if getattr(user, "role", None) == "admin":
            return queryset.filter(created_by=user)
        if getattr(user, "role", None) == "supplier":
            return queryset.none()
        return queryset

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status not in {Procurement.Status.PENDING_REVIEW, Procurement.Status.REVISION_REQUIRED}:
            raise ValidationError({"detail": "Only pending review or revision required requests can be edited."})
        serializer.save()


class ApproveProcurementRequestView(APIView):
    permission_classes = [IsSchoolHead]

    def patch(self, request, pk):
        try:
            procurement = Procurement.objects.get(pk=pk)
        except Procurement.DoesNotExist:
            return Response({"error": "Procurement request not found."}, status=404)

        block_reason = get_review_block_reason(procurement)
        if block_reason:
            return Response({"error": block_reason}, status=400)

        try:
            result = apply_review_action(procurement, "approved", request.data.get("remarks", ""), request.user)
        except ValidationError as error:
            return Response({"error": error.detail.get("detail", "Unable to approve this request.")}, status=400)
        project = result["project"]
        if project.procurement_schedule and project.procurement_schedule <= timezone.localdate():
            publish_project(project, request.user, scheduled=True)

        log_audit("APPROVE", request.user, f"Approved procurement request {procurement.project_title}", "procurement", procurement.id)
        notify_request_review(
            procurement,
            request.user,
            "approved",
            f'School Head approved your procurement request: {procurement.project_title}. Publish it when ready.',
        )
        return Response({
            "message": "Request approved. Project saved as draft.",
            "request": ProcurementSerializer(result["request"], context={"request": request}).data,
            "project": ProjectSerializer(project, context={"request": request}).data,
        })


class RejectProcurementRequestView(APIView):
    permission_classes = [IsSchoolHead]

    def patch(self, request, pk):
        try:
            procurement = Procurement.objects.get(pk=pk)
        except Procurement.DoesNotExist:
            return Response({"error": "Procurement request not found."}, status=404)

        block_reason = get_review_block_reason(procurement)
        if block_reason:
            return Response({"error": block_reason}, status=400)

        reason = str(request.data.get("rejection_reason", "")).strip()
        if not reason:
            return Response({"error": "Rejection reason is required."}, status=400)

        apply_review_action(procurement, "rejected", reason, request.user)

        log_audit("REJECT", request.user, f"Rejected procurement request {procurement.project_title}", "procurement", procurement.id)
        notify_request_review(
            procurement,
            request.user,
            "rejected",
            f'School Head rejected your procurement request: {procurement.project_title}. Reason: {reason}',
        )
        return Response(ProcurementSerializer(procurement, context={"request": request}).data)


class ReturnForRevisionView(APIView):
    permission_classes = [IsSchoolHead]

    def patch(self, request, pk):
        try:
            procurement = Procurement.objects.get(pk=pk)
        except Procurement.DoesNotExist:
            return Response({"error": "Procurement request not found."}, status=404)

        notes = str(request.data.get("revision_notes", "")).strip()
        if not notes:
            return Response({"error": "Revision notes are required."}, status=400)

        apply_review_action(procurement, "revision_required", notes, request.user)

        log_audit("UPDATE", request.user, f"Returned procurement request {procurement.project_title} for revision", "procurement", procurement.id)
        return Response(ProcurementSerializer(procurement, context={"request": request}).data)


class ProcurementRequestReviewView(APIView):
    permission_classes = [IsSchoolHead]

    def patch(self, request, pk):
        try:
            procurement = Procurement.objects.get(pk=pk)
        except Procurement.DoesNotExist:
            return Response({"error": "Procurement request not found."}, status=404)

        action = str(request.data.get("action", "")).strip().lower()
        remarks = request.data.get("remarks", "")
        if action not in {"approved", "rejected", "revision_required"}:
            return Response({"error": "Invalid action."}, status=400)

        block_reason = get_review_block_reason(procurement)
        if block_reason:
            return Response({"error": block_reason}, status=400)

        try:
            result = apply_review_action(procurement, action, remarks, request.user)
        except ValidationError as error:
            return Response({"error": error.detail.get("detail", "Unable to review this request.")}, status=400)
        response = {
            "message": "Request reviewed successfully.",
            "request": ProcurementSerializer(result["request"], context={"request": request}).data,
        }
        if result["project"] is not None:
            response["project"] = ProjectSerializer(result["project"], context={"request": request}).data
        return Response(response)


class PublicResultsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.localdate()
        projects = (
            Project.objects.filter(status=Project.Status.AWARDED)
            .select_related("created_by")
            .prefetch_related("bids__supplier")
            .order_by("-awarded_at", "-updated_at")
        )

        results = []
        for project in projects:
            # Skip public results that have expired
            if project.public_result_expiry_date and today > project.public_result_expiry_date:
                continue

            winning_bid = project.bids.filter(status=Bid.Status.WON).select_related("supplier").first()
            if not winning_bid:
                continue

            results.append(
                {
                    "project_id": str(project.id),
                    "project_title": project.title,
                    "budget": float(project.budget or 0),
                    "procurement_type": project.procurement_type,
                    "deadline": project.deadline,
                    "public_result_expiry_date": project.public_result_expiry_date,
                    "awarded_at": project.awarded_at or project.updated_at,
                    "winner": {
                        "supplier_name": winning_bid.supplier.company_name if winning_bid.supplier and winning_bid.supplier.company_name else winning_bid.supplier.full_name if winning_bid.supplier else winning_bid.company_name,
                        "bid_amount": float(winning_bid.bid_amount),
                        "submitted_at": winning_bid.submitted_at,
                    },
                }
            )

        return Response(results)


class PublicProjectStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "total_projects": Project.objects.count(),
                "active_bidding": Project.objects.filter(status=Project.Status.ACTIVE).count(),
            }
        )


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.select_related("created_by", "procurement_request").prefetch_related("bids")
        if getattr(user, "role", None) == "supplier" and getattr(user, "status", None) not in {"approved", "active"}:
            return queryset.none()
        if getattr(user, "role", None) == "supplier":
            return queryset.filter(status=Project.Status.ACTIVE, deadline__gte=timezone.localdate(), is_archived=False)
        return queryset

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status in {Project.Status.ACTIVE, Project.Status.CLOSED, Project.Status.AWARDED}:
            return Response({"error": "This project has been published and cannot be edited or deleted."}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status in {Project.Status.ACTIVE, Project.Status.CLOSED, Project.Status.AWARDED}:
            return Response({"error": "This project has been published and cannot be edited or deleted."}, status=403)
        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status == Project.Status.AWARDED:
            raise PermissionDenied(detail={"error": "This project has been awarded and cannot be edited."})
        project = serializer.save()
        log_audit("UPDATE", self.request.user, f"Updated project {project.title}", "project", project.id)

    def perform_destroy(self, instance):
        log_audit("DELETE", self.request.user, f"Deleted project {instance.title}", "project", instance.id)
        instance.delete()


class ProjectHistoryView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Project.objects.select_related("created_by", "procurement_request").prefetch_related("bids").filter(is_archived=True).order_by("-archived_at", "-created_at")


class ApprovedProjectRecordsView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsSchoolHead]

    def get_queryset(self):
        return (
            Project.objects.select_related("created_by", "procurement_request")
            .prefetch_related("bids")
            .filter(procurement_request__status=Procurement.Status.APPROVED)
            .order_by("-updated_at", "-created_at")
        )


class ArchiveProjectView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=404)

        if project.is_archived:
            return Response({"error": "Project is already archived."}, status=400)

        reason = str(request.data.get("reason", "Archived by admin")).strip() or "Archived by admin"
        archive_project(project, request.user, reason)

        return Response({
            "message": f'Project "{project.title}" has been archived.',
            "project": ProjectSerializer(project, context={"request": request}).data,
        })


class UnarchiveProjectView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=404)

        if not project.is_archived:
            return Response({"error": "Project is not archived."}, status=400)

        unarchive_project(project)

        return Response({
            "message": f'Project "{project.title}" has been restored.',
            "project": ProjectSerializer(project, context={"request": request}).data,
        })


class ProcurementListCreateView(generics.ListCreateAPIView):
    serializer_class = ProcurementSerializer
    

class ProcurementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Procurement.objects.all()
    serializer_class = ProcurementSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrSchoolHead()]
        return [IsAdmin()]


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return AuditLog.objects.all().order_by('-created_at')


class DocumentUploadListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return DocumentUpload.objects.all().order_by('-created_at')
        return DocumentUpload.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProcurementReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_projects = Project.objects.count()
        active_projects = Project.objects.filter(status=Project.Status.ACTIVE).count()
        awarded_projects = Project.objects.filter(status=Project.Status.AWARDED).count()
        total_bids = Bid.objects.count()
        total_awarded_amount = BlockchainRecord.objects.aggregate(total=Sum("bid_amount"))["total"] or 0

        by_procurement_type = list(
            Project.objects.values("procurement_type").annotate(count=Count("id")).order_by("procurement_type")
        )

        recent_awards = list(
            BlockchainRecord.objects.select_related("project", "winner")
            .order_by("-recorded_at")
            .values(
                "project__title",
                "winner__full_name",
                "winner__company_name",
                "bid_amount",
                "recorded_at",
            )[:10]
        )

        return Response(
            {
                "summary": {
                    "total_projects": total_projects,
                    "active_projects": active_projects,
                    "awarded_projects": awarded_projects,
                    "total_bids": total_bids,
                    "total_awarded_amount": total_awarded_amount,
                },
                "by_procurement_type": by_procurement_type,
                "recent_awards": recent_awards,
            }
        )


class SupplierReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        suppliers = User.objects.filter(role=User.Role.SUPPLIER).annotate(
            bid_count=Count("bids", distinct=True),
            wins=Count("blockchain_records", distinct=True),
        ).order_by("-created_at")

        supplier_list = [
            {
                "id": supplier.id,
                "full_name": supplier.full_name,
                "email": supplier.email,
                "company_name": supplier.company_name,
                "business_type": supplier.business_type,
                "status": supplier.status,
                "bid_count": supplier.bid_count,
                "wins": supplier.wins,
            }
            for supplier in suppliers
        ]

        return Response(
            {
                "summary": {
                    "total_suppliers": suppliers.count(),
                    "approved": suppliers.filter(status=User.Status.APPROVED).count(),
                    "pending": suppliers.filter(status=User.Status.PENDING).count(),
                    "rejected": suppliers.filter(status=User.Status.REJECTED).count(),
                },
                "supplier_list": supplier_list,
            }
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    from django.utils import timezone

    total_projects = Project.objects.count()
    total_bids = Bid.objects.count()
    active_bidding = Project.objects.filter(status=Project.Status.ACTIVE).count()
    awarded_contracts = Project.objects.filter(status=Project.Status.AWARDED).count()

    return Response({
        'total_projects': total_projects,
        'total_bids': total_bids,
        'active_bidding': active_bidding,
        'awarded_contracts': awarded_contracts,
    })
