"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPlatformConfig } from "./config";

export async function fetchAppData() {
  const session = await getServerSession(authOptions);

  let role = session?.user?.role || "reseller";
  let resellerId = session?.user?.resellerId || "r1";
  let vendorId = session?.user?.vendorId || null;
  const userId = session?.user?.id || "mock-user-id";

  // Fallback for older sessions that didn't store vendorId/resellerId in the JWT token
  if (session?.user?.email && (!vendorId || !resellerId)) {
    const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
    if (dbUser) {
      if (!vendorId && dbUser.vendorId) vendorId = dbUser.vendorId;
      if (!resellerId && dbUser.resellerId) resellerId = dbUser.resellerId;
      role = dbUser.role; // Ensure role is fresh too
    }
  }

  console.log("fetchAppData => role:", role, "vendorId:", vendorId, "resellerId:", resellerId, "email:", session?.user?.email);

  // Common data promises
  const categoriesPromise = db.category.findMany();
  const configPromise = getPlatformConfig();

  let productsPromise: Promise<any[]>;
  if (role === "admin") {
    productsPromise = db.product.findMany({ orderBy: { createdAt: "desc" } });
  } else if (role === "vendor" && vendorId) {
    productsPromise = db.product.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });
  } else {
    // Reseller: only approved + active products
    productsPromise = db.product.findMany({
      where: { approvalStatus: "APPROVED", isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  const notificationsPromise = db.notification.findMany({
    where: {
      OR: [
        { target: "admin" },
        { target: userId },
        { target: resellerId },
        ...(vendorId ? [{ target: vendorId }] : []),
      ],
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  let mePromise: Promise<any> = Promise.resolve(null);
  let meVendorPromise: Promise<any> = Promise.resolve(null);
  let ordersPromise: Promise<any[]> = Promise.resolve([]);
  let ledgerPromise: Promise<any[]> = Promise.resolve([]);
  let payoutsPromise: Promise<any[]> = Promise.resolve([]);
  let unlocksPromise: Promise<any[]> = Promise.resolve([]);
  let messagesPromise: Promise<any[]> = Promise.resolve([]);
  let kycRequestsPromise: Promise<any[]> = Promise.resolve([]);
  let resellersPromise: Promise<any[]> = Promise.resolve([]);
  let vendorsPromise: Promise<any[]> = Promise.resolve([]);

  if (role === "reseller") {
    mePromise = db.reseller.findUnique({ where: { id: resellerId } });
    ordersPromise = db.order.findMany({
      where: { resellerId },
      orderBy: { createdAt: "desc" },
    });
    ledgerPromise = db.ledger.findMany({ where: { resellerId }, orderBy: { date: "desc" } });
    payoutsPromise = db.payout.findMany({ where: { resellerId }, orderBy: { requestedAt: "desc" } });
    unlocksPromise = db.unlock.findMany({ where: { resellerId }, orderBy: { date: "desc" } });
    messagesPromise = db.message.findMany({ where: { resellerId }, orderBy: { at: "asc" } });
  } else if (role === "vendor" && vendorId) {
    meVendorPromise = db.vendor.findUnique({ where: { id: vendorId } });
    ordersPromise = db.order.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });
    ledgerPromise = db.ledger.findMany({ where: { vendorId }, orderBy: { date: "desc" } });
    payoutsPromise = db.payout.findMany({ where: { vendorId }, orderBy: { requestedAt: "desc" } });
    messagesPromise = db.message.findMany({ where: { resellerId: vendorId }, orderBy: { at: "asc" } });
  } else if (role === "admin") {
    ordersPromise = db.order.findMany({ orderBy: { createdAt: "desc" } });
    ledgerPromise = db.ledger.findMany({ orderBy: { date: "desc" }, take: 200 });
    payoutsPromise = db.payout.findMany({ orderBy: { requestedAt: "desc" } });
    unlocksPromise = db.unlock.findMany({ orderBy: { date: "desc" } });
    resellersPromise = db.reseller.findMany({ orderBy: { createdAt: "desc" } });
    vendorsPromise = db.vendor.findMany({ orderBy: { createdAt: "desc" } });
    kycRequestsPromise = db.kycRequest.findMany({ orderBy: { createdAt: "desc" } });
    messagesPromise = db.message.findMany({ orderBy: { at: "desc" }, take: 100 });
  }

  // Batch 1: Common data
  const [categories, config, notifications, products] = await Promise.all([
    categoriesPromise,
    configPromise,
    notificationsPromise,
    productsPromise
  ]);

  // Batch 2: Core role data
  const [me, meVendor, orders, ledger, payouts] = await Promise.all([
    mePromise,
    meVendorPromise,
    ordersPromise,
    ledgerPromise,
    payoutsPromise
  ]);

  // Batch 3: Additional role data
  const [unlocks, messages, kycRequests, resellers, vendors] = await Promise.all([
    unlocksPromise,
    messagesPromise,
    kycRequestsPromise,
    resellersPromise,
    vendorsPromise
  ]);

  if (role === "vendor" && vendorId) {
    console.log("fetchAppData => meVendor found:", !!meVendor);
  }

  return {
    role,
    config,
    state: {
      categories,
      products,
      me,
      meVendor,
      orders,
      ledger,
      payouts,
      unlocks,
      messages,
      notifications,
      kycRequests,
      resellers,
      vendors,
    },
  };
}
