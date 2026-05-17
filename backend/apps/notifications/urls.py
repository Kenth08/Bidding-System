from django.urls import path

from . import views

urlpatterns = [
    path("", views.NotificationListView.as_view()),
    path("unread-count/", views.NotificationUnreadCountView.as_view()),
    path("read-all/", views.MarkAllReadView.as_view()),
    path("mark-all-read/", views.MarkAllReadView.as_view()),
    path("<uuid:pk>/read/", views.MarkOneReadView.as_view()),
]
