-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(128) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'supplier',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "company_name" VARCHAR(255) NOT NULL DEFAULT '',
    "company_address" VARCHAR(255) NOT NULL DEFAULT '',
    "phone" VARCHAR(50) NOT NULL DEFAULT '',
    "business_type" VARCHAR(100) NOT NULL DEFAULT '',
    "business_permit_document" TEXT,
    "is_staff" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_superuser" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_project" (
    "id" UUID NOT NULL,
    "procurement_request_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "budget" DECIMAL(15,2) NOT NULL,
    "deadline" DATE NOT NULL,
    "procurement_schedule" DATE,
    "public_result_expiry_date" DATE,
    "requirements" TEXT NOT NULL DEFAULT '',
    "procurement_type" VARCHAR(50) NOT NULL DEFAULT 'Services',
    "delivery_period" INTEGER NOT NULL DEFAULT 0,
    "technical_specifications" TEXT NOT NULL DEFAULT '',
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_reason" VARCHAR(255),
    "published_at" TIMESTAMP(3),
    "awarded_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurements" (
    "id" UUID NOT NULL,
    "project_title" VARCHAR(255) NOT NULL,
    "budget" DECIMAL(15,2) NOT NULL,
    "deadline" DATE,
    "public_result_expiry_date" DATE,
    "procurement_type" VARCHAR(50) NOT NULL,
    "technical_specifications" TEXT NOT NULL DEFAULT '',
    "procurement_schedule" VARCHAR(255) NOT NULL DEFAULT '',
    "delivery_period" VARCHAR(255) NOT NULL DEFAULT '',
    "status" VARCHAR(30) NOT NULL DEFAULT 'Pending Review',
    "rejection_reason" TEXT NOT NULL DEFAULT '',
    "revision_notes" TEXT NOT NULL DEFAULT '',
    "review_remarks" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids_bid" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "company_name" VARCHAR(255) NOT NULL DEFAULT '',
    "bid_amount" DECIMAL(12,2) NOT NULL,
    "proposal" TEXT NOT NULL DEFAULT '',
    "quotation_file" TEXT,
    "technical_proposal" TEXT,
    "supporting_documents" TEXT,
    "quotation_document" TEXT,
    "technical_document" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'submitted',
    "technical_compliance" BOOLEAN DEFAULT false,
    "evaluation_remarks" TEXT NOT NULL DEFAULT '',
    "rank" INTEGER,
    "recorded" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_blockchainrecord" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "bid_id" UUID NOT NULL,
    "winner_id" UUID NOT NULL,
    "bid_amount" DECIMAL(15,2) NOT NULL,
    "hash" TEXT NOT NULL,
    "project_ref_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_blockchainrecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "user_id" UUID,
    "description" TEXT NOT NULL DEFAULT '',
    "resource_type" VARCHAR(100) NOT NULL DEFAULT '',
    "resource_id" VARCHAR(255) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_uploads" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file" TEXT,
    "file_size" INTEGER NOT NULL DEFAULT 0,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" VARCHAR(255),
    "related_id" VARCHAR(64),
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_procurement_request_id_key" ON "projects_project"("procurement_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "bids_bid_project_id_supplier_id_key" ON "bids_bid"("project_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_blockchainrecord_hash_key" ON "blockchain_blockchainrecord"("hash");

-- AddForeignKey
ALTER TABLE "projects_project" ADD CONSTRAINT "projects_project_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_project" ADD CONSTRAINT "projects_project_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "procurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids_bid" ADD CONSTRAINT "bids_bid_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids_bid" ADD CONSTRAINT "bids_bid_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_blockchainrecord" ADD CONSTRAINT "blockchain_blockchainrecord_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_blockchainrecord" ADD CONSTRAINT "blockchain_blockchainrecord_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids_bid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_blockchainrecord" ADD CONSTRAINT "blockchain_blockchainrecord_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
