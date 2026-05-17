from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by("-created_at")


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"count": count})


class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."})

    def post(self, request):
        return self.patch(request)


class MarkOneReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.is_read = True
            notif.save(update_fields=["is_read"])
            return Response(NotificationSerializer(notif).data)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)
