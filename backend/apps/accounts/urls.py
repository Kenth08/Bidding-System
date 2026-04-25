from django.urls import path

from .views import (
    LoginView,
    LogoutView,
    MeView,
    RegisterSupplierView,
    SupplierApproveView,
    SupplierRejectView,
    SuppliersView,
    SupplierStatusUpdateView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("register-supplier/", RegisterSupplierView.as_view(), name="register-supplier"),
    path("suppliers/", SuppliersView.as_view(), name="suppliers"),
    path("suppliers/<int:supplier_id>/status/", SupplierStatusUpdateView.as_view(), name="supplier-status"),
    path("suppliers/<int:supplier_id>/approve/", SupplierApproveView.as_view(), name="supplier-approve"),
    path("suppliers/<int:supplier_id>/reject/", SupplierRejectView.as_view(), name="supplier-reject"),
    path("me/", MeView.as_view(), name="me"),
]
