from django.contrib import admin
from django.urls import include, path
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.views import DashboardStatsView


def favicon_view(request):
    """Handle favicon.ico requests"""
    return HttpResponse(status=204)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class RootView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({
            "message": "Blockchain E-Procurement API",
            "version": "1.0",
            "endpoints": {
                "health": "/api/health/",
                "auth": "/api/v1/auth/",
                "projects": "/api/v1/projects/",
                "bids": "/api/v1/bids/",
                "blockchain": "/api/v1/blockchain/",
                "dashboard": "/api/v1/dashboard/stats/",
                "admin": "/admin/"
            }
        })


urlpatterns = [
    path("", RootView.as_view(), name="root"),
    path("favicon.ico", favicon_view, name="favicon"),
    path("admin/", admin.site.urls),
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/projects/", include("apps.projects.urls")),
    path("api/bids/", include("apps.bids.urls")),
    path("api/blockchain/", include("apps.blockchain.urls")),
    path("api/dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("api/v1/health/", HealthView.as_view(), name="health-v1"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/projects/", include("apps.projects.urls")),
    path("api/v1/bids/", include("apps.bids.urls")),
    path("api/v1/blockchain/", include("apps.blockchain.urls")),
    path("api/v1/dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats-v1"),
]
