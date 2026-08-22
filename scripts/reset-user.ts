import { db } from "../src/lib/db";
import bcrypt from "bcrypt";

async function main() {
  const email = "dangerchamp2@gmail.com";
  const password = "11221122";
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if User exists
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    await db.user.update({
      where: { email },
      data: { passwordHash },
    });
    console.log(`Updated password for existing User: ${email}`);
    return;
  }

  // Check if KycRequest exists
  const existingKyc = await db.kycRequest.findFirst({ where: { email } });
  if (existingKyc) {
    await db.kycRequest.updateMany({
      where: { email },
      data: { passwordHash, status: "Approved" },
    });

    let resellerId = null;
    let vendorId = null;

    if (existingKyc.accountType === "vendor") {
      const vendor = await db.vendor.create({
        data: {
          name: existingKyc.name,
          brandName: `${existingKyc.name}'s Supply`,
          phone: existingKyc.phone,
          email: existingKyc.email,
          bankName: existingKyc.bankName || "Default Bank",
          accountName: existingKyc.accountName || existingKyc.name,
          accountNumber: existingKyc.accountNumber || "0000000000",
        },
      });
      vendorId = vendor.id;
    } else {
      const reseller = await db.reseller.create({
        data: {
          name: existingKyc.name,
          brandName: `${existingKyc.name}'s Store`,
          phone: existingKyc.phone,
          email: existingKyc.email,
        },
      });
      resellerId = reseller.id;
    }

    await db.user.create({
      data: {
        email,
        passwordHash,
        role: existingKyc.accountType || "reseller",
        resellerId,
        vendorId,
      },
    });
    console.log(`Approved KYC and created User: ${email}`);
    return;
  }

  // If user doesn't exist at all, create default Reseller & User
  const reseller = await db.reseller.create({
    data: {
      name: "Danger Champ",
      brandName: "Danger Champ Store",
      phone: "03001234567",
      email: email,
    },
  });

  await db.user.create({
    data: {
      email,
      passwordHash,
      role: "reseller",
      resellerId: reseller.id,
    },
  });
  console.log(`Created new approved User: ${email}`);
}

main().catch(console.error).finally(() => process.exit());
