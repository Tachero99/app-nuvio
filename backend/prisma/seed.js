// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input = "") {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

async function upsertUser({ name, email, password, role }) {
  const hash = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      status: "ACTIVE",
      password: hash, // ✅ tu schema usa "password"
    },
    create: {
      name,
      email,
      role,
      status: "ACTIVE",
      password: hash,
    },
  });
}

async function main() {
  const superName = process.env.SEED_SUPERADMIN_NAME || "Super Admin";
  const superEmail = process.env.SEED_SUPERADMIN_EMAIL || "superadmin@nuvio.com";
  const superPass = process.env.SEED_SUPERADMIN_PASSWORD || "Admin123!";

  const ownerName = process.env.SEED_OWNER_NAME || "Cliente Demo";
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "cliente@nuvio.com";
  const ownerPass = process.env.SEED_OWNER_PASSWORD || "Cliente123!";

  const businessName = process.env.SEED_BUSINESS_NAME || "Mi Negocio";
  const businessSlug = process.env.SEED_BUSINESS_SLUG || slugify(businessName);

  // 1) SUPERADMIN
  const superadmin = await upsertUser({
    name: superName,
    email: superEmail,
    password: superPass,
    role: "SUPERADMIN",
  });

  // 2) CLIENT_OWNER
  const owner = await upsertUser({
    name: ownerName,
    email: ownerEmail,
    password: ownerPass,
    role: "CLIENT_OWNER",
  });

  // 3) Business para el owner (ownerId es unique, así que usamos upsert por slug)
  const business = await prisma.business.upsert({
    where: { slug: businessSlug },
    update: {
      name: businessName,
      ownerId: owner.id,
      isActive: true,
    },
    create: {
      name: businessName,
      slug: businessSlug,
      ownerId: owner.id,
      isActive: true,
    },
  });

  console.log("✅ Seed OK");
  console.log("SUPERADMIN:", { id: superadmin.id, email: superadmin.email, pass: superPass });
  console.log("OWNER:", { id: owner.id, email: owner.email, pass: ownerPass });
  console.log("BUSINESS:", { id: business.id, slug: business.slug, ownerId: business.ownerId });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
