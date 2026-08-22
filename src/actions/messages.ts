"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Pakistan Standard Time: UTC+5
function isSupportOpen(): boolean {
  const now = new Date();
  const pkt = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const h = pkt.getHours();
  return h >= 12 && h < 17; // 12:00 PM – 5:00 PM
}

/**
 * Send a message — reseller/vendor → admin or admin → user.
 * Enforces business hours for new messages from users.
 */
export async function sendMessage(
  resellerId: string,
  from: "reseller" | "vendor" | "admin",
  text: string,
  attachmentUrl?: string,
  attachmentType?: string
) {
  // Business hours check — only for non-admin senders
  if (from !== "admin" && !isSupportOpen()) {
    throw new Error("Support is currently closed. Hours: 12:00 PM – 5:00 PM (Pakistan Time).");
  }

  const msg = await db.message.create({
    data: {
      resellerId,
      from,
      text,
      attachmentUrl: attachmentUrl ?? null,
      attachmentType: attachmentType ?? null,
      isRead: false,
    },
  });

  // Notify admin when user sends a message
  if (from !== "admin") {
    await db.notification.create({
      data: {
        target: "admin",
        title: "💬 New Support Message",
        message: `New message from ${from} (${resellerId}): "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
        type: "info",
      },
    });
  } else {
    // Admin replied → notify the reseller
    await db.notification.create({
      data: {
        target: resellerId,
        title: "💬 Support Reply",
        message: `Admin replied: "${text.slice(0, 80)}${text.length > 80 ? "…" : ""}"`,
        type: "info",
      },
    });
  }

  return msg;
}

/**
 * Get all messages for a chat thread.
 */
export async function getMessages(resellerId: string) {
  return await db.message.findMany({
    where: { resellerId },
    orderBy: { at: "asc" },
  });
}

/**
 * Mark all messages in a thread as read (from the user's perspective).
 */
export async function markMessagesRead(resellerId: string, reader: "admin" | "reseller") {
  // Mark as read = messages sent by the OTHER party
  const fromFilter = reader === "admin" ? { from: "reseller" } : { from: "admin" };
  await db.message.updateMany({
    where: { resellerId, ...fromFilter, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Get unread count for admin (all unread messages from users).
 */
export async function getAdminUnreadCount() {
  return await db.message.count({
    where: { from: { not: "admin" }, isRead: false },
  });
}

/**
 * Get unread count for a reseller (unread admin replies).
 */
export async function getResellerUnreadCount(resellerId: string) {
  return await db.message.count({
    where: { resellerId, from: "admin", isRead: false },
  });
}

/**
 * Mark all notifications for a target as read.
 */
export async function markNotificationsReadAction(target: string) {
  await db.notification.updateMany({
    where: { target, read: false },
    data: { read: true },
  });
}

/**
 * Mark a single notification as read.
 */
export async function markSingleNotificationReadAction(id: string) {
  await db.notification.update({
    where: { id },
    data: { read: true },
  });
}
