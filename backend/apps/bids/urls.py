from django.urls import path

from .views import (
    BidListCreateView,
    BidDetailView,
    MarkUnderReviewView,
    BidPublicCountView,
    RecordToBlockchainView,
    SelectWinnerView,
    NoticeOfAwardView,
    NoticeToProceedView,
    ResolutionToAwardView,
)

urlpatterns = [
    path("", BidListCreateView.as_view(), name="bid-list-create"),
    path("public/", BidPublicCountView.as_view(), name="bid-public-count"),
    path("<uuid:pk>/", BidDetailView.as_view(), name="bid-detail"),
    path("<uuid:pk>/documents/noa/", NoticeOfAwardView.as_view(), name="bid-document-noa"),
    path("<uuid:pk>/documents/ntp/", NoticeToProceedView.as_view(), name="bid-document-ntp"),
    path("<uuid:pk>/documents/resolution/", ResolutionToAwardView.as_view(), name="bid-document-resolution"),
    path("<uuid:pk>/review/", MarkUnderReviewView.as_view(), name="bid-review"),
    path("<uuid:pk>/select/", SelectWinnerView.as_view(), name="bid-select"),
    path("<uuid:pk>/record/", RecordToBlockchainView.as_view(), name="bid-record"),
]
