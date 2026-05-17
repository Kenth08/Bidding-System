from django.urls import path

from .views import (
    ProcurementRequestListCreateView,
    ProcurementRequestDetailView,
    ProcurementRequestReviewView,
)

urlpatterns = [
    path("", ProcurementRequestListCreateView.as_view(), name="procurement-request-list-create"),
    path("<uuid:pk>/", ProcurementRequestDetailView.as_view(), name="procurement-request-detail"),
    path("<uuid:pk>/review/", ProcurementRequestReviewView.as_view(), name="procurement-request-review"),
]