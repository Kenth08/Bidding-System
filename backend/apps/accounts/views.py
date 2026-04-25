import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.http import HttpRequest
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import CsrfExemptSessionAuthentication
from .models import Profile
from .serializers import ProfileSerializer


def _json_body(request: HttpRequest):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


def _is_admin(user):
    if not user.is_authenticated:
        return False
    profile = getattr(user, "profile", None)
    return bool(profile and profile.role == Profile.Role.ADMIN)


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

        profile = getattr(user, "profile", None)
        if not profile:
            return Response({"error": "Your account profile was not found."}, status=404)

        if profile.role == Profile.Role.SUPPLIER and profile.status == Profile.Status.PENDING:
            return Response({"error": "Your account is pending admin approval."}, status=403)

        if profile.role == Profile.Role.SUPPLIER and profile.status == Profile.Status.REJECTED:
            return Response({"error": "Your registration has been rejected."}, status=403)

        login(request, user)
        serialized_profile = ProfileSerializer(profile).data
        return Response({
            "user": serialized_profile,
            "role": serialized_profile.get("role")
        })


class LogoutView(APIView):
    permission_classes = []

    def post(self, request):
        logout(request)
        return Response({"success": True})


class RegisterSupplierView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = _json_body(request)
        full_name = str(payload.get("fullName", "")).strip()
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", "")).strip()
        company_name = str(payload.get("companyName", "")).strip()
        company_address = str(payload.get("companyAddress", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        business_type = str(payload.get("businessType", "")).strip() or "Other"

        if not full_name or not email or not password or not company_name:
            return Response({"error": "Please fill in all required fields."}, status=400)
        if len(password) < 6:
            return Response({"error": "Password must be at least 6 characters."}, status=400)

        try:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=full_name,
            )
            Profile.objects.create(
                user=user,
                role=Profile.Role.SUPPLIER,
                status=Profile.Status.PENDING,
                company_name=company_name,
                company_address=company_address,
                phone=phone,
                business_type=business_type,
            )
        except IntegrityError:
            return Response({"error": "This email is already registered."}, status=409)

        return Response({"success": True}, status=201)


class SuppliersView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"error": "Forbidden."}, status=403)

        suppliers = (
            Profile.objects.select_related("user")
            .filter(role=Profile.Role.SUPPLIER)
            .order_by("-created_at")
        )
        return Response({"data": ProfileSerializer(suppliers, many=True).data})


class SupplierStatusUpdateView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, supplier_id):
        if not _is_admin(request.user):
            return Response({"error": "Forbidden."}, status=403)

        payload = _json_body(request)
        status = str(payload.get("status", "")).strip().lower()
        if status not in [Profile.Status.APPROVED, Profile.Status.REJECTED]:
            return Response({"error": "Invalid supplier status."}, status=400)

        try:
            supplier = Profile.objects.get(id=supplier_id, role=Profile.Role.SUPPLIER)
        except Profile.DoesNotExist:
            return Response({"error": "Supplier not found."}, status=404)

        supplier.status = status
        supplier.save(update_fields=["status", "updated_at"])
        return Response({"success": True})


class SupplierApproveView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, supplier_id):
        if not _is_admin(request.user):
            return Response({"error": "Forbidden."}, status=403)

        try:
            supplier = Profile.objects.get(id=supplier_id, role=Profile.Role.SUPPLIER)
        except Profile.DoesNotExist:
            return Response({"error": "Supplier not found."}, status=404)

        supplier.status = Profile.Status.APPROVED
        supplier.save(update_fields=["status", "updated_at"])
        return Response({"success": True})


class SupplierRejectView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, supplier_id):
        if not _is_admin(request.user):
            return Response({"error": "Forbidden."}, status=403)

        try:
            supplier = Profile.objects.get(id=supplier_id, role=Profile.Role.SUPPLIER)
        except Profile.DoesNotExist:
            return Response({"error": "Supplier not found."}, status=404)

        supplier.status = Profile.Status.REJECTED
        supplier.save(update_fields=["status", "updated_at"])
        return Response({"success": True})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response(
                {
                    "id": request.user.id,
                    "email": request.user.email,
                    "username": request.user.username,
                    "full_name": request.user.first_name or request.user.username,
                    "role": None,
                    "status": None,
                }
            )

        data = ProfileSerializer(profile).data
        return Response(data)
