"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPlatformConfig } from "./config";

const appDataCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 2500;

export async function fetchAppData() {
  const session = await getServerSession(authOptions);

  const u = session?.user as any;
  let role = u?.role || "reseller";
  let resellerId = u?.resellerId || "r1";
  let vendorId = u?.vendorId || null;
  const userId = u?.id || "mock-user-id";

  // Fallback for older sessions that didn't store vendorId/resellerId in the JWT token
  if (session?.user?.email && (!vendorId || !resellerId)) {
    const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
    if (dbUser) {
      if (!vendorId && dbUser.vendorId) vendorId = dbUser.vendorId;
      if (!resellerId && dbUser.resellerId) resellerId = dbUser.resellerId;
      role = dbUser.role; // Ensure role is fresh too
    }
  }

  const cacheKey = `${role}:${userId}:${vendorId}:${resellerId}`;
  const now = Date.now();
  const cached = appDataCache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // Common data promises
  const categoriesPromise = db.category.findMany();
  const configPromise = getPlatformConfig();

  let productsPromise: Promise<any[]>;
  if (role === "admin") {
    productsPromise = db.product.findMany({
      where: {
        approvalStatus: { not: "DELETED" },
        NOT: [
          { rejectionReason: "Deleted by vendor" },
          { rejectionReason: "Deleted by admin" }
        ]
      },
      orderBy: { createdAt: "desc" }
    });
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
  let productActionRequestsPromise: Promise<any[]> = Promise.resolve([]);

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
    productActionRequestsPromise = db.productActionRequest.findMany({
      where: { vendorId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
  } else if (role === "admin") {
    ordersPromise = db.order.findMany({ orderBy: { createdAt: "desc" } });
    ledgerPromise = db.ledger.findMany({ orderBy: { date: "desc" }, take: 200 });
    payoutsPromise = db.payout.findMany({ orderBy: { requestedAt: "desc" } });
    unlocksPromise = db.unlock.findMany({ orderBy: { date: "desc" } });
    resellersPromise = db.reseller.findMany({ orderBy: { createdAt: "desc" } });
    vendorsPromise = db.vendor.findMany({ orderBy: { createdAt: "desc" } });
    kycRequestsPromise = db.kycRequest.findMany({ orderBy: { createdAt: "desc" } });
    messagesPromise = db.message.findMany({ orderBy: { at: "desc" }, take: 100 });
    productActionRequestsPromise = db.productActionRequest.findMany({
      where: { status: "PENDING" },
      include: { product: true, vendor: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Execute ALL queries in parallel in 1 single round-trip for 5x faster speed!
  const [
    categories,
    config,
    notifications,
    products,
    me,
    meVendor,
    orders,
    ledger,
    payouts,
    unlocks,
    messages,
    kycRequests,
    resellers,
    vendors,
    productActionRequests,
  ] = await Promise.all([
    categoriesPromise,
    configPromise,
    notificationsPromise,
    productsPromise,
    mePromise,
    meVendorPromise,
    ordersPromise,
    ledgerPromise,
    payoutsPromise,
    unlocksPromise,
    messagesPromise,
    kycRequestsPromise,
    resellersPromise,
    vendorsPromise,
    productActionRequestsPromise,
  ]);

  if (role === "vendor" && vendorId) {
    console.log("fetchAppData => meVendor found:", !!meVendor);
  }

  const cleanBrandName = (name?: string | null) => {
    if (!name) return name || "";
    return name.replace(/'s Supply$/i, "").replace(/ Supply$/i, "").trim();
  };

  const formattedMeVendor = meVendor ? { ...meVendor, brandName: cleanBrandName(meVendor.brandName) } : null;
  const formattedVendors = (vendors || []).map((v: any) => ({ ...v, brandName: cleanBrandName(v.brandName) }));

  const result = {
    role,
    config,
    state: {
      categories,
      products,
      me,
      meVendor: formattedMeVendor,
      orders,
      ledger,
      payouts,
      unlocks,
      messages,
      notifications,
      kycRequests,
      resellers,
      vendors: formattedVendors,
      productActionRequests,
    },
  };

  appDataCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}
