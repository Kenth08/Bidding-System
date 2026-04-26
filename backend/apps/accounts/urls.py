from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import (
    LoginView,
    RegisterView,
    MeView,
    UserListCreateView,
    UserDetailView,
    SupplierListView,
    UpdateSupplierStatusView,
)
from .views import LogoutView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("register/", RegisterView.as_view(), name="register"),
    path("register-supplier/", RegisterView.as_view(), name="register-supplier"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("suppliers/", SupplierListView.as_view(), name="suppliers"),
    path("suppliers/<uuid:pk>/status/", UpdateSupplierStatusView.as_view(), name="supplier-status"),
    path("me/", MeView.as_view(), name="me"),
]
