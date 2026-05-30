/**
 * Dev-only script to reset a user's password with a proper bcrypt hash.
 *
 * Usage:
 *   npx tsx scripts/reset-user-password.ts <email> <new-password>
 *
 * Example:
 *   npx tsx scripts/reset-user-password.ts supplier@example.com MyNewPass123
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, newPassword] = process.argv.slice(2);

  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>");
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password_hash } });

  console.log(`Password updated successfully for: ${user.email} (${user.full_name})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
