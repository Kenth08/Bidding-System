from django.contrib.auth import authenticate, get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdmin
from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        password = request.data.get("password", "")

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

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
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        })


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Registration submitted. Pending admin approval."},
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
        return Response(UserSerializer(supplier).data)
