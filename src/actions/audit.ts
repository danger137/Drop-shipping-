"use server";

import { db } from "@/lib/db";

/**
 * Logs a critical admin action to the AuditLog table.
 * Call this whenever an admin changes anything important.
 */
export async function logAdminAction({
  adminId,
  action,
  entity,
  entityId,
  prevValue,
  newValue,
  note,
}: {
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  prevValue?: string;
  newValue?: string;
  note?: string;
}) {
  await db.auditLog.create({
    data: {
      adminId,
      action,
      entity,
      entityId,
      prevValue: prevValue ?? null,
      newValue: newValue ?? null,
      note: note ?? null,
    },
  });
}

export async function getAuditLogs(limit = 100) {
  return await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
