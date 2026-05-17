from django.contrib.auth import authenticate, get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from config.throttling import LoginRateThrottle

from .permissions import IsAdmin
from .serializers import UserSerializer, RegisterSerializer
from apps.projects.models import DocumentUpload
from apps.projects.audit import log_audit
from apps.notifications.utils import notify_admins, notify_user

User = get_user_model()


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        password = request.data.get("password", "")

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"error": "Account not found."}, status=status.HTTP_404_NOT_FOUND)

        if not user.check_password(password):
            return Response({"error": "Wrong password."}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(request, username=email, password=password)

        if not user:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)

        if user.role == User.Role.SUPPLIER and user.status == User.Status.PENDING:
            return Response({"error": "Your account is pending admin approval."}, status=status.HTTP_403_FORBIDDEN)

        if user.role == User.Role.SUPPLIER and user.status == User.Status.REJECTED:
            return Response({"error": "Your registration has been rejected."}, status=status.HTTP_403_FORBIDDEN)

        if not user.is_active or user.status == User.Status.INACTIVE:
            return Response({"error": "Your account is inactive."}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        try:
            log_audit("LOGIN", user, f"{user.full_name} logged in", "auth", user.id)
        except Exception:
            pass  # Silently ignore audit logging errors
        
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        })


class RegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            file_map = {
                DocumentUpload.DocumentType.LEGAL_DOCUMENTS: request.FILES.get("legal_documents"),
                DocumentUpload.DocumentType.BUSINESS_PERMIT: request.FILES.get("business_permit"),
                DocumentUpload.DocumentType.PHILGEPS_REGISTRATION: request.FILES.get("philgeps_registration"),
            }
            for document_type, uploaded_file in file_map.items():
                if uploaded_file:
                    DocumentUpload.objects.create(
                        user=user,
                        document_type=document_type,
                        file_name=uploaded_file.name,
                        file=uploaded_file,
                        file_size=uploaded_file.size,
                    )
            log_audit("CREATE", user, f"Supplier registration submitted for {user.company_name}", "supplier", user.id)
            notify_admins(
                notification_type="new_supplier",
                title="New Supplier Registration",
                message=f"{user.full_name} from {user.company_name or 'unknown company'} has registered and is pending approval.",
                link="/admin/suppliers",
                related_id=str(user.id),
            )
            return Response(
                {"message": "Registration submitted. Check your email for verification. Pending admin approval."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        password = self.request.data.get("password")
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def perform_update(self, serializer):
        password = self.request.data.get("password")
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()


class SupplierListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role=User.Role.SUPPLIER).order_by("-created_at")


class UpdateSupplierStatusView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            supplier = User.objects.get(pk=pk, role=User.Role.SUPPLIER)
        except User.DoesNotExist:
            return Response({"error": "Supplier not found"}, status=status.HTTP_404_NOT_FOUND)

        new_status = str(request.data.get("status", "")).strip().lower()
        allowed = {
            User.Status.APPROVED,
            User.Status.REJECTED,
            User.Status.ACTIVE,
            User.Status.INACTIVE,
        }
        normalized = new_status.lower()
        if normalized not in allowed:
            return Response(
                {"error": f"Status must be one of: {sorted(list(allowed))}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        supplier.status = normalized
        supplier.save(update_fields=["status", "updated_at"])
        log_audit("UPDATE", request.user, f"Supplier {supplier.full_name} status changed to {supplier.status}", "supplier", supplier.id)

        if normalized == User.Status.APPROVED:
            notify_user(
                user=supplier,
                notification_type="supplier_approved",
                title="Account Approved",
                message="Your supplier account has been approved. You can now view and bid on projects.",
                link="/supplier/projects",
            )
        elif normalized == User.Status.REJECTED:
            notify_user(
                user=supplier,
                notification_type="supplier_rejected",
                title="Account Rejected",
                message="Your supplier account was not approved. Please contact the administrator.",
                link="/supplier/profile",
            )

        return Response(UserSerializer(supplier).data)
