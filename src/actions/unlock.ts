"use server";

import { db } from "@/lib/db";

/**
 * Submit a COD unlock request from a reseller.
 */
export default async function requestUnlock(resellerId: string, trxId: string, receipt: string) {
  if (!trxId || !receipt) throw new Error("TRX ID and receipt are required");

  // Check for pending existing request
  const existing = await db.unlock.findFirst({
    where: { resellerId, status: "Pending" },
  });
  if (existing) throw new Error("You already have a pending unlock request.");

  return await db.unlock.create({
    data: {
      resellerId,
      trxId,
      receipt,
      amount: 500,
      method: "EasyPaisa / JazzCash / Bank",
      status: "Pending",
    },
  });
}
