const fs = require('fs');
if (fs.existsSync('.env')) {
  const env = fs.readFileSync('.env', 'utf8');
  env.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function run() {
  const email = "dangerchamp2@gmail.com";
  const password = "11221122";
  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });
    console.log("SUCCESS: User password updated to 11221122");
    return;
  }

  const existingKyc = await prisma.kycRequest.findFirst({ where: { email } });
  let resellerId = null;

  if (existingKyc) {
    await prisma.kycRequest.updateMany({
      where: { email },
      data: { passwordHash, status: "Approved" }
    });
  }

  const reseller = await prisma.reseller.create({
    data: {
      name: existingKyc?.name || "Danger Champ",
      brandName: existingKyc ? `${existingKyc.name}'s Store` : "Danger Champ Store",
      phone: existingKyc?.phone || "03001234567",
      email: email
    }
  });
  resellerId = reseller.id;

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: existingKyc?.accountType || "reseller",
      resellerId
    }
  });

  console.log("SUCCESS: User created and password set to 11221122");
}

run().then(() => prisma.$disconnect()).catch(err => { console.error(err); prisma.$disconnect(); });
