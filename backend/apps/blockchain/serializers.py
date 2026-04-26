from rest_framework import serializers

from .models import BlockchainRecord


class BlockchainRecordPublicSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source="project.title", read_only=True)
    winner_name = serializers.CharField(source="winner.full_name", read_only=True)
    winner_company = serializers.CharField(source="winner.company_name", read_only=True)
    bid_amount = serializers.DecimalField(source="bid_amount", max_digits=15, decimal_places=2, read_only=True)
    recorded_at = serializers.DateTimeField(source="recorded_at", format="%Y-%m-%d %H:%M:%S", read_only=True)
    award_date = serializers.DateTimeField(source="recorded_at", format="%Y-%m-%d", read_only=True)

    class Meta:
        model = BlockchainRecord
        fields = [
            "id",
            "project_title",
            "project_ref_id",
            "winner_name",
            "winner_company",
            "bid_amount",
            "recorded_at",
            "award_date",
        ]
        read_only_fields = fields


class BlockchainRecordAdminSerializer(serializers.ModelSerializer):
    projectTitle = serializers.CharField(source="project.title", read_only=True)
    winner = serializers.CharField(source="winner.full_name", read_only=True)
    winnerCompany = serializers.CharField(source="winner.company_name", read_only=True)
    bidAmount = serializers.DecimalField(source="bid_amount", max_digits=15, decimal_places=2, read_only=True)
    recordedAt = serializers.DateTimeField(source="recorded_at", format="%Y-%m-%d %H:%M:%S", read_only=True)
    awardDate = serializers.DateTimeField(source="recorded_at", format="%Y-%m-%d", read_only=True)

    class Meta:
        model = BlockchainRecord
        fields = [
            "id",
            "project",
            "projectTitle",
            "project_ref_id",
            "bid",
            "winner",
            "winnerCompany",
            "bidAmount",
            "hash",
            "recorded_at",
            "recordedAt",
            "awardDate",
        ]
        read_only_fields = [
            "project",
            "projectTitle",
            "project_ref_id",
            "bid",
            "winner",
            "winnerCompany",
            "bidAmount",
            "hash",
            "recorded_at",
            "recordedAt",
            "awardDate",
        ]


# Keep alias for admin legacy use
BlockchainRecordSerializer = BlockchainRecordAdminSerializer
