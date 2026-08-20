"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAdminAction } from "./audit";
import { getPlatformConfig } from "./config";

// ── Internal helpers ────────────────────────────────────────────────────────

export async function creditWallet(
  targetId: string,
  role: "reseller" | "vendor",
  amount: number,
  label: string,
  tag: string,
  proof?: string,
  orderId?: string
) {
  return await db.$transaction(async (tx) => {
    if (role === "reseller") {
      await tx.reseller.update({
        where: { id: targetId },
        data: { balance: { increment: amount } },
      });
    } else {
      await tx.vendor.update({
        where: { id: targetId },
        data: { balance: { increment: amount } },
      });
    }
    await tx.ledger.create({
      data: {
        resellerId: role === "reseller" ? targetId : null,
        vendorId: role === "vendor" ? targetId : null,
        orderId: orderId ?? null,
        label,
        tag,
        amount,
        proof: proof ?? null,
      },
    });
  });
}

export async function debitWallet(
  targetId: string,
  role: "reseller" | "vendor",
  amount: number,
  label: string,
  tag: string,
  proof?: string
) {
  return creditWallet(targetId, role, -Math.abs(amount), label, tag, proof);
}

// ── Request Withdrawal ──────────────────────────────────────────────────────

export async function requestWithdrawal(
  amount: number,
  method: string,
  accountName: string,
  accountNumber: string
) {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId || "r1";
  const vendorId = session?.user?.vendorId || null;
  const role = session?.user?.role || "reseller";
  const isVendor = role === "vendor";

  const config = await getPlatformConfig();
  if (amount < config.minWithdrawal) {
    throw new Error(`Minimum withdrawal is PKR ${config.minWithdrawal}`);
  }

  return await db.$transaction(async (tx) => {
    let availableBalance = 0;
    let codReserve = 0;

    if (isVendor && vendorId) {
      const v = await tx.vendor.findUnique({ where: { id: vendorId } });
      availableBalance = v?.balance ?? 0;
    } else if (resellerId) {
      const r = await tx.reseller.findUnique({ where: { id: resellerId } });
      availableBalance = r?.balance ?? 0;
      codReserve = r?.codReserve ?? 0;
    }

    // Never allow withdrawal of COD reserve
    const withdrawable = availableBalance - codReserve;
    if (amount > withdrawable) {
      throw new Error(
        `Insufficient withdrawable balance. Available: PKR ${Math.round(withdrawable).toLocaleString()} (COD reserve PKR ${codReserve} is locked).`
      );
    }

    const payout = await tx.payout.create({
      data: {
        resellerId: isVendor ? null : resellerId,
        vendorId: isVendor ? vendorId : null,
        amount,
        method,
        accountName,
        accountNumber,
        status: "Pending",
      },
    });

    // Hold the amount (deduct from balance immediately so it can't be double-withdrawn)
    if (isVendor && vendorId) {
      await tx.vendor.update({
        where: { id: vendorId },
        data: { balance: { decrement: amount } },
      });
      await tx.ledger.create({
        data: {
          vendorId,
          label: `Withdrawal Request — ${method}`,
          tag: "Withdrawal",
          amount: -amount,
        },
      });
    } else if (resellerId) {
      await tx.reseller.update({
        where: { id: resellerId },
        data: { balance: { decrement: amount } },
      });
      await tx.ledger.create({
        data: {
          resellerId,
          label: `Withdrawal Request — ${method} to ${accountName}`,
          tag: "Withdrawal",
          amount: -amount,
        },
      });
    }

    return payout;
  });
}

// ── Approve Withdrawal (Admin) ──────────────────────────────────────────────

export async function approveWithdrawal(
  payoutId: string,
  approve: boolean,
  paymentRef?: string,
  adminNote?: string
) {
  const session = await getServerSession(authOptions);
  const adminId = session?.user?.id || "admin";
  if (session?.user?.role && session.user.role !== "admin") throw new Error("Unauthorized");

  const payout = await db.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new Error("Payout not found");
  if (payout.status !== "Pending") throw new Error("Already processed");

  if (approve) {
    await db.payout.update({
      where: { id: payoutId },
      data: {
        status: "Paid",
        paymentRef: paymentRef ?? null,
        adminNote: adminNote ?? null,
        processedBy: adminId,
        processedAt: new Date(),
      },
    });

    // Update totalWithdrawn
    if (payout.resellerId) {
      await db.reseller.update({
        where: { id: payout.resellerId },
        data: { totalWithdrawn: { increment: payout.amount } },
      });
      await db.notification.create({
        data: {
          target: payout.resellerId,
          title: "✅ Withdrawal Paid",
          message: `Your withdrawal of PKR ${Math.round(payout.amount).toLocaleString()} has been processed via ${payout.method}.`,
          type: "success",
        },
      });
    } else if (payout.vendorId) {
      await db.vendor.update({
        where: { id: payout.vendorId },
        data: { totalWithdrawn: { increment: payout.amount } },
      });
      await db.notification.create({
        data: {
          target: payout.vendorId,
          title: "✅ Withdrawal Paid",
          message: `Your withdrawal of PKR ${Math.round(payout.amount).toLocaleString()} has been processed.`,
          type: "success",
        },
      });
    }
  } else {
    // Rejected: refund the held amount back to balance
    await db.payout.update({
      where: { id: payoutId },
      data: {
        status: "Rejected",
        adminNote: adminNote ?? null,
        processedBy: adminId,
        processedAt: new Date(),
      },
    });

    if (payout.resellerId) {
      await db.reseller.update({
        where: { id: payout.resellerId },
        data: { balance: { increment: payout.amount } },
      });
      await db.ledger.create({
        data: {
          resellerId: payout.resellerId,
          label: `Withdrawal Rejected — Refunded`,
          tag: "Refund",
          amount: payout.amount,
        },
      });
      await db.notification.create({
        data: {
          target: payout.resellerId,
          title: "❌ Withdrawal Rejected",
          message: adminNote
            ? `Withdrawal rejected: ${adminNote}`
            : "Your withdrawal request was rejected. Amount refunded to your balance.",
          type: "error",
        },
      });
    } else if (payout.vendorId) {
      await db.vendor.update({
        where: { id: payout.vendorId },
        data: { balance: { increment: payout.amount } },
      });
    }
  }

  await logAdminAction({
    adminId,
    action: approve ? "APPROVE_WITHDRAWAL" : "REJECT_WITHDRAWAL",
    entity: "Payout",
    entityId: payoutId,
    prevValue: "Pending",
    newValue: approve ? "Paid" : "Rejected",
    note: adminNote,
  });

  return { success: true };
}

// ── Manual Wallet Credit (Admin) ────────────────────────────────────────────

export async function adminManualCredit(
  targetId: string,
  role: "reseller" | "vendor",
  amount: number,
  label: string,
  note?: string
) {
  const session = await getServerSession(authOptions);
  const adminId = session?.user?.id || "admin";
  if (session?.user?.role && session.user.role !== "admin") throw new Error("Unauthorized");

  await creditWallet(targetId, role, amount, label, "Adjustment");

  await logAdminAction({
    adminId,
    action: "MANUAL_CREDIT",
    entity: role === "reseller" ? "Reseller" : "Vendor",
    entityId: targetId,
    newValue: `+PKR ${amount} — ${label}`,
    note,
  });

  return { success: true };
}

// ── processSettlement (exported for use in orders) ──────────────────────────

export async function processSettlement(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  // Guard against double settlement
  const existing = await db.ledger.findFirst({
    where: { resellerId: order.resellerId, tag: "Profit", label: { contains: order.id } },
  });
  if (existing) throw new Error("Order already settled");

  await creditWallet(
    order.resellerId,
    "reseller",
    order.profit,
    `Profit — Order ${order.id} (${order.productTitle})`,
    "Profit",
    undefined,
    order.id
  );

  if (order.vendorId) {
    const vendorAmount = order.wholesale - order.vendorFee;
    await creditWallet(
      order.vendorId,
      "vendor",
      vendorAmount,
      `Sale — Order ${order.id} (${order.productTitle})`,
      "Sale",
      undefined,
      order.id
    );
  }

  return true;
}
