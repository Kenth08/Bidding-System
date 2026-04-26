from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project
from .serializers import ProjectSerializer
from apps.bids.models import Bid
from apps.blockchain.models import BlockchainRecord
from apps.users.permissions import IsAdmin


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Project.objects.all().order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdmin()]


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
