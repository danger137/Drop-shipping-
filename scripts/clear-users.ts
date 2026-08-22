import { db } from "../src/lib/db";

async function main() {
  console.log("Checking current users, resellers, vendors, and KYC requests...");
  
  const users = await db.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("Users in DB:", users);

  const resellers = await db.reseller.findMany({ select: { id: true, name: true, email: true } });
  console.log("Resellers count:", resellers.length);

  const vendors = await db.vendor.findMany({ select: { id: true, name: true, email: true } });
  console.log("Vendors count:", vendors.length);

  const kycs = await db.kycRequest.findMany({ select: { id: true, email: true, accountType: true, status: true } });
  console.log("KYC Requests count:", kycs.length);

  console.log("\nDeleting all Reseller, Vendor, and KYC data...");

  // Delete related transactional data to avoid FK constraint errors
  await db.stockMovement.deleteMany({});
  await db.courierShipment.deleteMany({});
  await db.orderTimeline.deleteMany({});
  await db.order.deleteMany({});
  await db.ledger.deleteMany({});
  await db.payout.deleteMany({});
  await db.unlock.deleteMany({});
  await db.message.deleteMany({});
  await db.conversation.deleteMany({});
  await db.shopifyMapping.deleteMany({});

  // Delete Users that are resellers or vendors (keep admins)
  const deletedUsers = await db.user.deleteMany({
    where: {
      OR: [
        { role: { in: ["reseller", "vendor"] } },
        { resellerId: { not: null } },
        { vendorId: { not: null } },
      ]
    }
  });
  console.log(`Deleted ${deletedUsers.count} non-admin User accounts.`);

  // Delete all Resellers
  const deletedResellers = await db.reseller.deleteMany({});
  console.log(`Deleted ${deletedResellers.count} Reseller records.`);

  // Delete all Vendors
  const deletedVendors = await db.vendor.deleteMany({});
  console.log(`Deleted ${deletedVendors.count} Vendor records.`);

  // Delete all KycRequests
  const deletedKycs = await db.kycRequest.deleteMany({});
  console.log(`Deleted ${deletedKycs.count} KYC Request records.`);

  console.log("\n--- CLEANUP COMPLETE ---");
  const remainingUsers = await db.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("Remaining Users in DB:", remainingUsers);
}

main()
  .catch((e) => console.error("Error clearing users:", e))
  .finally(() => db.$disconnect());
