import hashlib
import time

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Bid
from .serializers import BidSerializer
from apps.blockchain.models import BlockchainRecord
from apps.blockchain.serializers import BlockchainRecordSerializer
from apps.users.permissions import IsAdmin, IsSupplier
from apps.projects.models import Project


class BidListCreateView(generics.ListCreateAPIView):
    serializer_class = BidSerializer

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
        serializer.save(supplier=self.request.user)


class BidDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = BidSerializer
    queryset = Bid.objects.all()


class MarkUnderReviewView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            bid = Bid.objects.get(pk=pk)
            bid.status = Bid.Status.UNDER_REVIEW
            bid.save(update_fields=['status', 'updated_at'])
            return Response(BidSerializer(bid).data)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found'}, status=status.HTTP_404_NOT_FOUND)


class SelectWinnerView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            bid = Bid.objects.select_related('project', 'supplier').get(pk=pk)

            Bid.objects.filter(project=bid.project).exclude(pk=pk).update(status=Bid.Status.REJECTED)

            bid.status = Bid.Status.SELECTED
            bid.save(update_fields=['status', 'updated_at'])

            Project.objects.filter(pk=bid.project.pk).update(status=Project.Status.AWARDED)

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

            return Response(BlockchainRecordSerializer(record).data, status=status.HTTP_201_CREATED)
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found or not selected'}, status=status.HTTP_404_NOT_FOUND)
