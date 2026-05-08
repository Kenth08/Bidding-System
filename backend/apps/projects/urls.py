from django.urls import path

from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    PublishProjectView,
    ProcurementListCreateView,
    ProcurementDetailView,
    AuditLogListView,
    DocumentUploadListCreateView,
    PublicResultsView,
)

urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project-list-create"),
    path("<uuid:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("<uuid:pk>/publish/", PublishProjectView.as_view(), name="project-publish"),
    path("procurements/", ProcurementListCreateView.as_view(), name="procurement-list-create"),
    path("procurements/<uuid:pk>/", ProcurementDetailView.as_view(), name="procurement-detail"),
    path("audit-logs/", AuditLogListView.as_view(), name="audit-log-list"),
    path("documents/", DocumentUploadListCreateView.as_view(), name="document-upload-list-create"),
    path("public/results/", PublicResultsView.as_view(), name="public-results"),
]
