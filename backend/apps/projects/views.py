from datetime import date

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, Procurement, AuditLog, DocumentUpload
from .serializers import ProjectSerializer, ProcurementSerializer, AuditLogSerializer, DocumentUploadSerializer
from apps.bids.models import Bid
from apps.blockchain.models import BlockchainRecord
from apps.users.permissions import IsAdmin
from apps.projects.audit import log_audit

User = get_user_model()


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        # Admins see all projects
        if getattr(user, "role", None) == "admin":
            queryset = Project.objects.all().order_by("-created_at")
        else:
            # Suppliers: strict visibility rules
            if getattr(user, "role", None) == "supplier":
                if getattr(user, "status", None) != "approved":
                    return Project.objects.none()
                # approved suppliers see only active projects
                queryset = Project.objects.filter(status=Project.Status.ACTIVE).order_by("-created_at")
            else:
                # other authenticated users: default to all
                queryset = Project.objects.all().order_by("-created_at")

        # Auto-close past-deadline active projects
        for project in queryset:
            if project.deadline and project.deadline < date.today() and project.status == Project.Status.ACTIVE:
                project.status = Project.Status.CLOSED
                project.save(update_fields=["status", "updated_at"])

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

        if project.status != Project.Status.DRAFT:
            return Response({"detail": "Only draft projects can be published."}, status=400)

        project.status = Project.Status.ACTIVE
        project.save(update_fields=["status", "updated_at"])
        log_audit("UPDATE", request.user, f"Published project {project.title}", "project", project.id)
        return Response(ProjectSerializer(project, context={"request": request}).data)


class PublicResultsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        projects = Project.objects.filter(status=Project.Status.AWARDED).order_by("-updated_at")
        results = []
        for proj in projects:
            winning_bid = Bid.objects.filter(project=proj, status=Bid.Status.SELECTED).first()
            if not winning_bid:
                continue
            results.append({
                "project_id": str(proj.id),
                "project_title": proj.title,
                "budget": str(proj.budget),
                "award_date": proj.updated_at,
                "winning_supplier": winning_bid.supplier.full_name if winning_bid.supplier else winning_bid.company_name,
                "winning_bid_amount": str(winning_bid.bid_amount),
            })

        return Response({"results": results})


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdmin()]

    def perform_update(self, serializer):
        project = serializer.save()
        log_audit("UPDATE", self.request.user, f"Updated project {project.title}", "project", project.id)

    def perform_destroy(self, instance):
        log_audit("DELETE", self.request.user, f"Deleted project {instance.title}", "project", instance.id)
        instance.delete()


class ProcurementListCreateView(generics.ListCreateAPIView):
    serializer_class = ProcurementSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Procurement.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        procurement = serializer.save(created_by=self.request.user)
        log_audit("CREATE", self.request.user, f"Created procurement request {procurement.project_title}", "procurement", procurement.id)


class ProcurementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Procurement.objects.all()
    serializer_class = ProcurementSerializer
    permission_classes = [IsAdmin]


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


class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_projects = Project.objects.count()
        total_bids = Bid.objects.count()
        active_bidding = Project.objects.filter(status=Project.Status.ACTIVE).count()
        awarded_contracts = Project.objects.filter(status=Project.Status.AWARDED).count()
        blockchain_records = BlockchainRecord.objects.count()

        return Response(
            {
                "total_projects": total_projects,
                "total_bids": total_bids,
                "active_bidding": active_bidding,
                "awarded_contracts": awarded_contracts,
                "blockchain_records": blockchain_records,
            }
        )
