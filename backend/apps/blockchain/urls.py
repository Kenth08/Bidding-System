from django.urls import path

from .views import BlockchainDetailView, BlockchainListView

urlpatterns = [
    path("", BlockchainListView.as_view(), name="blockchain-list"),
    path("<uuid:pk>/", BlockchainDetailView.as_view(), name="blockchain-detail"),
]
