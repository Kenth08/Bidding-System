-- CreateTable
CREATE TABLE IF NOT EXISTS "business_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "supplier_business_types" (
    "supplier_id" UUID NOT NULL,
    "business_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_business_types" (
    "project_id" UUID NOT NULL,
    "business_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "bid_activity_logs" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "bid_id" UUID,
    "supplier_id" UUID,
    "user_id" UUID,
    "role" VARCHAR(30) NOT NULL DEFAULT 'system',
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bid_activity_logs_pkey" PRIMARY KEY ("id")
);

-- AddColumn (open_to_all on projects_project)
ALTER TABLE "projects_project" ADD COLUMN IF NOT EXISTS "open_to_all" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "business_types_name_key" ON "business_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "supplier_business_types_supplier_id_business_type_id_key" ON "supplier_business_types"("supplier_id", "business_type_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "project_business_types_project_id_business_type_id_key" ON "project_business_types"("project_id", "business_type_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bid_activity_logs_project_id_idx" ON "bid_activity_logs"("project_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bid_activity_logs_supplier_id_idx" ON "bid_activity_logs"("supplier_id");

-- AddForeignKey
ALTER TABLE "supplier_business_types" ADD CONSTRAINT "supplier_business_types_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_business_types" ADD CONSTRAINT "supplier_business_types_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_business_types" ADD CONSTRAINT "project_business_types_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_business_types" ADD CONSTRAINT "project_business_types_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
