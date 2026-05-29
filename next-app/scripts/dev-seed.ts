import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";

const db = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local. Cannot run dev seeder.");
    process.exit(1);
  }

  console.log("🔧 Running dev seeder...");

  const supplierEmails = ["supplier@gmail.com", "supplier2@gmail.com"];

  for (const email of supplierEmails) {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`  ⚠️  Supplier ${email} not found — create it first (run prisma seed)`);
      continue;
    }

    const workflow = await db.supplierDocumentWorkflow.findUnique({ where: { supplier_id: user.id } });
    if (!workflow) {
      await db.supplierDocumentWorkflow.create({
        data: {
          id: uuid(),
          supplier_id: user.id,
          account_locked: false,
          notif_sent: false,
          flagged_reasons: {},
        },
      });
      console.log(`  ✅ Created workflow for ${email}`);
    } else {
      console.log(`  ⏭️  Workflow already exists for ${email}`);
    }

    // create a few document uploads
    const docs = [
      { type: "mayors_permit", name: "mayors_permit_sample.pdf" },
      { type: "sec_dti_certificate", name: "dti_certificate_sample.pdf" },
    ];

    for (const d of docs) {
      const existing = await db.documentUpload.findFirst({ where: { user_id: user.id, document_type: d.type } });
      if (existing) {
        console.log(`  ⏭️  Document ${d.type} already exists for ${email}`);
        continue;
      }

      await db.documentUpload.create({
        data: {
          id: uuid(),
          user_id: user.id,
          document_type: d.type,
          file_name: d.name,
          file: null,
          file_size: 0,
          verification_status: "pending_review",
        },
      });
      console.log(`  ✅ Created document ${d.type} for ${email}`);
    }
  }

  console.log("\n✨ Dev seed complete.");
}

main()
  .catch((e) => {
    console.error("Dev seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
