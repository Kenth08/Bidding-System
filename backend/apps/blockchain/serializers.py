from rest_framework import serializers

from .models import BlockchainRecord


class BlockchainRecordSerializer(serializers.ModelSerializer):
    projectTitle = serializers.CharField(source="project.title", read_only=True)
    winner = serializers.CharField(source="winner.full_name", read_only=True)
    winnerId = serializers.UUIDField(source="winner.id", read_only=True)
    winnerCompany = serializers.CharField(source="winner.company_name", read_only=True)
    bidAmount = serializers.DecimalField(source="bid_amount", max_digits=15, decimal_places=2, read_only=True)
    recordedAt = serializers.DateTimeField(source="recorded_at", format="%Y-%m-%d %H:%M:%S", read_only=True)
    awardDate = serializers.DateTimeField(source="recorded_at", format="%Y-%m-%d", read_only=True)
    isWinner = serializers.SerializerMethodField()

    class Meta:
        model = BlockchainRecord
        fields = [
            "id",
            "project",
            "projectTitle",
            "bid",
            "winner",
            "winnerId",
            "winnerCompany",
            "bid_amount",
            "bidAmount",
            "hash",
            "project_ref_id",
            "recorded_at",
            "recordedAt",
            "awardDate",
            "isWinner",
        ]
        read_only_fields = ["recorded_at", "recordedAt", "awardDate", "isWinner", "winner", "winnerId", "projectTitle", "bidAmount", "winnerCompany"]

    def get_isWinner(self, obj):
        return True
