from django.urls import path

from . import views

urlpatterns = [
    path("", views.BlockchainPublicListView.as_view(), name="blockchain-list"),
    path("public/", views.BlockchainPublicListView.as_view(), name="blockchain-public"),

    path("admin/", views.BlockchainAdminListView.as_view(), name="blockchain-admin"),
    path("admin/<uuid:pk>/", views.BlockchainAdminDetailView.as_view(), name="blockchain-admin-detail"),

    path("supplier/", views.BlockchainSupplierListView.as_view(), name="blockchain-supplier"),
]
