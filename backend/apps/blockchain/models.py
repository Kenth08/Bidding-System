import uuid

from django.conf import settings
from django.db import models


class BlockchainRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="blockchain_records")
    bid = models.ForeignKey("bids.Bid", on_delete=models.CASCADE, related_name="blockchain_records")
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blockchain_records")
    bid_amount = models.DecimalField(max_digits=15, decimal_places=2)
    hash = models.TextField(unique=True)
    project_ref_id = models.TextField(blank=True, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"BlockchainRecord {self.id}"
