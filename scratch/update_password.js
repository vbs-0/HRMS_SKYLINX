const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const passwordHash = await hash("password123", 12);
  const updatedUser = await prisma.user.update({
    where: { email: "manager@example.com" },
    data: { passwordHash }
  });
  console.log("SUCCESS: Password updated for user:", updatedUser.email);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
