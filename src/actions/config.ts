"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAdminAction } from "./audit";

/**
 * Get platform config — creates default if none exists
 */
export async function getPlatformConfig() {
  let config = await db.platformConfig.findFirst();
  if (!config) {
    config = await db.platformConfig.create({
      data: {
        deliveryFee: 250,
        platformFeePerOrder: 100,
        vendorFeePercent: 60,
        resellerFeePercent: 40,
        minWithdrawal: 1500,
        codReserveAmount: 500,
        firstOrdersMonitor: 2,
      },
    });
  }
  return config;
}

/**
 * Update platform config — admin only
 */
export async function updatePlatformConfig(data: {
  deliveryFee?: number;
  platformFeePerOrder?: number;
  vendorFeePercent?: number;
  resellerFeePercent?: number;
  minWithdrawal?: number;
  codReserveAmount?: number;
  firstOrdersMonitor?: number;
}) {
  const session = await getServerSession(authOptions);
  const adminId = session?.user?.id || "admin";
  if (session?.user?.role && session.user.role !== "admin") throw new Error("Unauthorized");

  const existing = await getPlatformConfig();

  const updated = await db.platformConfig.update({
    where: { id: existing.id },
    data: { ...data, updatedBy: adminId },
  });

  await logAdminAction({
    adminId,
    action: "UPDATE_PLATFORM_CONFIG",
    entity: "PlatformConfig",
    entityId: existing.id,
    prevValue: JSON.stringify({
      deliveryFee: existing.deliveryFee,
      platformFeePerOrder: existing.platformFeePerOrder,
      vendorFeePercent: existing.vendorFeePercent,
      resellerFeePercent: existing.resellerFeePercent,
      minWithdrawal: existing.minWithdrawal,
    }),
    newValue: JSON.stringify(data),
  });

  return updated;
}
