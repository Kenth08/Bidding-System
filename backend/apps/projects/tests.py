from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from apps.projects.models import Procurement, Project


class ProcurementWorkflowTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="password123",
            full_name="Admin User",
            role=User.Role.ADMIN,
            status=User.Status.ACTIVE,
        )
        self.school_head = User.objects.create_user(
            email="head@example.com",
            password="password123",
            full_name="School Head",
            role=User.Role.SCHOOL_HEAD,
            status=User.Status.ACTIVE,
        )
        self.supplier = User.objects.create_user(
            email="supplier@example.com",
            password="password123",
            full_name="Supplier User",
            role=User.Role.SUPPLIER,
            status=User.Status.APPROVED,
        )

    def _create_procurement(self, *, title="Laptop Procurement"):
        return Procurement.objects.create(
            project_title=title,
            budget=100000,
            deadline=timezone.localdate() + timedelta(days=14),
            procurement_type=Procurement.Type.GOODS,
            technical_specifications="Specs",
            procurement_schedule=(timezone.localdate() + timedelta(days=7)).isoformat(),
            delivery_period="30 days",
            created_by=self.admin,
        )

    def test_school_head_can_approve_request_and_create_project(self):
        procurement = self._create_procurement()

        self.client.force_authenticate(user=self.school_head)
        response = self.client.patch(
            f"/api/v1/projects/requests/{procurement.id}/review/",
            {"action": "approved", "remarks": "Looks good"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        procurement.refresh_from_db()
        self.assertEqual(procurement.status, Procurement.Status.APPROVED)
        self.assertTrue(Project.objects.filter(procurement_request=procurement).exists())

    def test_approved_request_cannot_be_reviewed_again(self):
        procurement = self._create_procurement()
        procurement.status = Procurement.Status.APPROVED
        procurement.save(update_fields=["status", "updated_at"])

        self.client.force_authenticate(user=self.school_head)
        response = self.client.patch(
            f"/api/v1/projects/requests/{procurement.id}/review/",
            {"action": "approved", "remarks": "Again"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already been approved", response.data["error"])

    def test_school_head_can_view_approved_project_records(self):
        procurement = self._create_procurement(title="Projector Purchase")
        procurement.status = Procurement.Status.APPROVED
        procurement.save(update_fields=["status", "updated_at"])
        project = Project.objects.create(
            procurement_request=procurement,
            title=procurement.project_title,
            budget=procurement.budget,
            deadline=procurement.deadline,
            procurement_schedule=timezone.localdate(),
            requirements=procurement.technical_specifications,
            procurement_type=procurement.procurement_type,
            delivery_period=30,
            technical_specifications=procurement.technical_specifications,
            status=Project.Status.DRAFT,
            created_by=self.admin,
        )
        project.is_archived = True
        project.archived_at = timezone.now()
        project.archived_reason = "Archived for records"
        project.save(update_fields=["is_archived", "archived_at", "archived_reason", "updated_at"])

        self.client.force_authenticate(user=self.school_head)
        response = self.client.get("/api/v1/projects/approved-records/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_admin_can_archive_project_and_view_history(self):
        procurement = self._create_procurement(title="Desktop Computers")
        project = Project.objects.create(
            procurement_request=procurement,
            title=procurement.project_title,
            budget=procurement.budget,
            deadline=procurement.deadline,
            procurement_schedule=timezone.localdate(),
            requirements=procurement.technical_specifications,
            procurement_type=procurement.procurement_type,
            delivery_period=30,
            technical_specifications=procurement.technical_specifications,
            status=Project.Status.DRAFT,
            created_by=self.admin,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f"/api/v1/projects/{project.id}/archive/", {"reason": "Completed"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertTrue(project.is_archived)

        history_response = self.client.get("/api/v1/projects/history/")
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(history_response.data), 1)