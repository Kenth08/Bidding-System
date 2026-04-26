from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

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
