import prisma from "./prismaClient.js";

async function main() {
  const users = await prisma.user.count();
  const businesses = await prisma.business.count();
  console.log({ users, businesses });
}

main()
  .catch((e) => {
    console.error("Prisma test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
