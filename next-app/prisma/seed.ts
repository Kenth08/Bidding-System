import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const SEED_USERS = [
  {
    email: "admin@gmail.com",
    password: "admin123",
    full_name: "System Administrator",
    role: "admin",
    status: "active",
    company_name: "",
    business_type: "",
  },
  {
    email: "schoolhead@gmail.com",
    password: "schoolhead123",
    full_name: "Juan Dela Cruz",
    role: "school_head",
    status: "active",
    company_name: "",
    business_type: "",
  },
  {
    email: "supplier@gmail.com",
    password: "supplier123",
    full_name: "Maria Santos",
    role: "supplier",
    status: "approved",
    company_name: "Santos Construction Inc.",
    business_type: "Construction",
  },
  {
    email: "supplier2@gmail.com",
    password: "supplier123",
    full_name: "Pedro Reyes",
    role: "supplier",
    status: "approved",
    company_name: "Reyes IT Solutions",
    business_type: "IT Services",
  },
  {
    email: "viewer@gmail.com",
    password: "viewer123",
    full_name: "Public Viewer",
    role: "viewer",
    status: "active",
    company_name: "",
    business_type: "",
  },
];

async function main() {
  console.log("🌱 Seeding accounts...\n");

  for (const user of SEED_USERS) {
    const existing = await db.user.findUnique({ where: { email: user.email } });
    if (existing) {
      console.log(`  ⏭️  ${user.email} (${user.role}) — already exists`);
      continue;
    }

    const password_hash = await bcrypt.hash(user.password, 10);
    await db.user.create({
      data: {
        id: uuid(),
        email: user.email,
        password_hash,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        company_name: user.company_name,
        business_type: user.business_type,
        is_active: true,
      },
    });

    console.log(`  ✅ ${user.email} (${user.role}) — created`);
  }

  console.log("\n✨ Seed complete!\n");
  console.log("Credentials:");
  console.log("┌─────────────────────────┬────────────────┬──────────────┐");
  console.log("│ Email                   │ Password       │ Role         │");
  console.log("├─────────────────────────┼────────────────┼──────────────┤");
  for (const u of SEED_USERS) {
    console.log(`│ ${u.email.padEnd(23)} │ ${u.password.padEnd(14)} │ ${u.role.padEnd(12)} │`);
  }
  console.log("└─────────────────────────┴────────────────┴──────────────┘");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
