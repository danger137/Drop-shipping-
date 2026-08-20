"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Request an edit to a pending order (reseller-side).
 * Stores the requested changes as JSON in `pendingEdits` and sets `editStatus` to "Pending".
 */
export async function requestOrderEditAction(
  orderId: string,
  edits: {
    customerName?: string;
    phone1?: string;
    city?: string;
    address?: string;
    variant?: string;
    status?: string; // For cancellation requests
  }
) {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId;

  if (!resellerId) throw new Error("Not authenticated as reseller");

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.resellerId !== resellerId) throw new Error("Unauthorized — this order doesn't belong to you");
  if (order.status !== "Pending") throw new Error("Only pending orders can be edited");
  if (order.editStatus === "Pending") throw new Error("An edit request is already pending for this order");

  // Handle cancellation request
  if (edits.status === "Cancelled") {
    const hoursSincePlacement = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSincePlacement > 1) {
      throw new Error("Cancellation window has passed (1 hour). Please contact support to cancel.");
    }
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      pendingEdits: JSON.stringify(edits),
      editStatus: "Pending",
    },
  });

  // Notify admin
  await db.notification.create({
    data: {
      target: "admin",
      title: edits.status === "Cancelled" ? "🚫 Cancellation Request" : "✏️ Order Edit Request",
      message: `Reseller requested ${edits.status === "Cancelled" ? "cancellation" : "edit"} for Order ${orderId}`,
      type: "info",
    },
  });

  return { success: true };
}

/**
 * Admin: Approve a pending order edit request.
 * Applies the stored `pendingEdits` to the actual order fields.
 */
export async function approveOrderEditAction(orderId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.editStatus !== "Pending") throw new Error("No pending edit request");

  const edits = JSON.parse(order.pendingEdits || "{}");

  // Apply edits to order
  const updateData: any = { editStatus: "Approved", pendingEdits: null };
  if (edits.customerName) updateData.customerName = edits.customerName;
  if (edits.phone1) updateData.phone1 = edits.phone1;
  if (edits.city) updateData.city = edits.city;
  if (edits.address) updateData.address = edits.address;
  if (edits.variant) updateData.variant = edits.variant;

  // If it's a cancellation request, update status
  if (edits.status === "Cancelled") {
    updateData.status = "Cancelled";
    updateData.settlementStatus = "Cancelled";
  }

  await db.order.update({ where: { id: orderId }, data: updateData });

  // Notify reseller
  await db.notification.create({
    data: {
      target: order.resellerId,
      title: edits.status === "Cancelled" ? "✅ Order Cancelled" : "✅ Edit Approved",
      message: `Your ${edits.status === "Cancelled" ? "cancellation" : "edit"} request for Order ${orderId} has been approved.`,
      type: "success",
    },
  });

  return { success: true };
}

/**
 * Admin: Reject a pending order edit request.
 */
export async function rejectOrderEditAction(orderId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.editStatus !== "Pending") throw new Error("No pending edit request");

  await db.order.update({
    where: { id: orderId },
    data: { editStatus: "Rejected", pendingEdits: null },
  });

  await db.notification.create({
    data: {
      target: order.resellerId,
      title: "❌ Edit Rejected",
      message: `Your edit request for Order ${orderId} has been rejected.`,
      type: "error",
    },
  });

  return { success: true };
}
