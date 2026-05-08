from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsAdmin
from .models import BlockchainRecord
from .serializers import (
    BlockchainRecordAdminSerializer,
    BlockchainRecordPublicSerializer,
)


class BlockchainPublicListView(generics.ListAPIView):
    """
    Public endpoint - no auth required, exposes no hash.
    """
    permission_classes = [AllowAny]
    serializer_class = BlockchainRecordPublicSerializer
    queryset = BlockchainRecord.objects.select_related("project", "winner").all().order_by("-recorded_at")


class BlockchainAdminListView(generics.ListAPIView):
    """
    Admin-only endpoint - includes hash and technical details.
    """
    permission_classes = [IsAdmin]
    serializer_class = BlockchainRecordAdminSerializer
    queryset = BlockchainRecord.objects.select_related("project", "winner", "bid").all().order_by("-recorded_at")


class BlockchainAdminDetailView(generics.RetrieveAPIView):
    """
    Admin-only endpoint for a single blockchain record.
    """
    permission_classes = [IsAdmin]
    serializer_class = BlockchainRecordAdminSerializer
    queryset = BlockchainRecord.objects.all()


class BlockchainSupplierListView(generics.ListAPIView):
    """
    Supplier endpoint - returns only the supplier's results, no hash.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BlockchainRecordPublicSerializer

    def get_queryset(self):
        return BlockchainRecord.objects.filter(winner=self.request.user).select_related(
            "project", "winner"
        ).order_by("-recorded_at")


class BlockchainVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        hash_value = str(request.query_params.get("hash", "")).strip()
        if not hash_value:
            return Response({"error": "Please provide a hash value."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            record = BlockchainRecord.objects.select_related("project", "winner").get(hash=hash_value)
        except BlockchainRecord.DoesNotExist:
            return Response(
                {
                    "verified": False,
                    "message": "No record found for this hash. This record may be invalid or tampered.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "verified": True,
                "project_title": record.project.title,
                "project_ref_id": record.project_ref_id,
                "winner_name": record.winner.full_name,
                "winner_company": record.winner.company_name,
                "bid_amount": float(record.bid_amount),
                "recorded_at": record.recorded_at,
                "message": "This record is authentic and has not been tampered with.",
            }
        )
