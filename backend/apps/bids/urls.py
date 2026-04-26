from django.urls import path

from .views import (
    BidListCreateView,
    BidDetailView,
    MarkUnderReviewView,
    RecordToBlockchainView,
    SelectWinnerView,
)

urlpatterns = [
    path("", BidListCreateView.as_view(), name="bid-list-create"),
    path("<uuid:pk>/", BidDetailView.as_view(), name="bid-detail"),
    path("<uuid:pk>/review/", MarkUnderReviewView.as_view(), name="bid-review"),
    path("<uuid:pk>/select/", SelectWinnerView.as_view(), name="bid-select"),
    path("<uuid:pk>/record/", RecordToBlockchainView.as_view(), name="bid-record"),
]
