import json

from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.http import HttpRequest
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer

User = get_user_model()


def _json_body(request: HttpRequest):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


def _is_admin(user):
    return bool(user and user.is_authenticated and getattr(user, "role", None) == User.Role.ADMIN)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = _json_body(request)
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", "")).strip()

        if not email or not password:
            return Response({"error": "Please enter your email and password."}, status=400)

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({"error": "Invalid email or password."}, status=401)

        if user.role == User.Role.SUPPLIER and user.status == User.Status.PENDING:
            return Response({"error": "Your account is pending admin approval."}, status=403)

        if user.role == User.Role.SUPPLIER and user.status == User.Status.REJECTED:
            return Response({"error": "Your registration has been rejected."}, status=403)

        refresh = RefreshToken.for_user(user)
        serialized_user = UserSerializer(user).data
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": serialized_user,
            }
        )


class LogoutView(APIView):
    permission_classes = []

    def post(self, request):
        return Response({"success": True})


class RegisterSupplierView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = _json_body(request)
        full_name = str(payload.get("full_name", "")).strip()
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", "")).strip()
        company_name = str(payload.get("company_name", "")).strip()
        company_address = str(payload.get("company_address", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        business_type = str(payload.get("business_type", "")).strip() or "Other"

        if not full_name or not email or not password or not company_name:
            return Response({"error": "Please fill in all required fields."}, status=400)
        if len(password) < 6:
            return Response({"error": "Password must be at least 6 characters."}, status=400)

        try:
            user = User.objects.create_user(
                email=email,
                password=password,
                full_name=full_name,
                company_name=company_name,
                company_address=company_address,
                phone=phone,
                business_type=business_type,
                role=User.Role.SUPPLIER,
                status=User.Status.PENDING,
            )
        except IntegrityError:
            return Response({"error": "This email is already registered."}, status=409)

        return Response({"success": True}, status=201)


class SuppliersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"error": "Forbidden."}, status=403)

        suppliers = User.objects.filter(role=User.Role.SUPPLIER).order_by("-created_at")
        return Response({"data": UserSerializer(suppliers, many=True).data})


class SupplierStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, supplier_id):
        if not _is_admin(request.user):
            return Response({"error": "Forbidden."}, status=403)

        payload = _json_body(request)
        status_value = str(payload.get("status", "")).strip().lower()
        if status_value not in [User.Status.APPROVED, User.Status.REJECTED]:
            return Response({"error": "Invalid supplier status."}, status=400)

        try:
            supplier = User.objects.get(id=supplier_id, role=User.Role.SUPPLIER)
        except User.DoesNotExist:
            return Response({"error": "Supplier not found."}, status=404)

        supplier.status = status_value
        supplier.save(update_fields=["status", "updated_at"])
        return Response({"success": True})


class SupplierApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, supplier_id):
        if not _is_admin(request.user):
            return Response({"error": "Forbidden."}, status=403)

        try:
            supplier = User.objects.get(id=supplier_id, role=User.Role.SUPPLIER)
        except User.DoesNotExist:
            return Response({"error": "Supplier not found."}, status=404)

        supplier.status = User.Status.APPROVED
        supplier.save(update_fields=["status", "updated_at"])
        return Response({"success": True})


class SupplierRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, supplier_id):
        if not _is_admin(request.user):
            return Response({"error": "Forbidden."}, status=403)

        try:
            supplier = User.objects.get(id=supplier_id, role=User.Role.SUPPLIER)
        except User.DoesNotExist:
            return Response({"error": "Supplier not found."}, status=404)

        supplier.status = User.Status.REJECTED
        supplier.save(update_fields=["status", "updated_at"])
        return Response({"success": True})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
