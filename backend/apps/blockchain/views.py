from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import BlockchainRecord
from .serializers import BlockchainRecordSerializer


class BlockchainListView(generics.ListAPIView):
    queryset = BlockchainRecord.objects.all().order_by("-recorded_at")
    serializer_class = BlockchainRecordSerializer
    permission_classes = [IsAuthenticated]


class BlockchainDetailView(generics.RetrieveAPIView):
    queryset = BlockchainRecord.objects.all()
    serializer_class = BlockchainRecordSerializer
    permission_classes = [IsAuthenticated]
