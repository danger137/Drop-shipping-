"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAdminAction } from "./audit";

/**
 * Record a stock movement and update product stock/reservedStock accordingly.
 * All inventory mutations go through here — never update Product.stock directly.
 */
async function createMovement(
  tx: any,
  productId: string,
  type: string,
  qty: number,
  performedBy: string,
  note?: string,
  orderId?: string,
  vendorId?: string
) {
  await tx.stockMovement.create({
    data: { productId, type, qty, note, orderId, performedBy, vendorId },
  });
}

/**
 * Admin receives vendor stock into warehouse.
 */
export async function receiveStock(productId: string, qty: number, note?: string) {
  const session = await getServerSession(authOptions);
  const adminId = session?.user?.id || "admin";
  if (session?.user?.role && session.user.role !== "admin") throw new Error("Unauthorized");
  if (qty <= 0) throw new Error("Quantity must be positive");

  return await db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: qty } },
    });

    await createMovement(tx, productId, "received", qty, adminId, note ?? `Stock received: +${qty} units`, undefined, product.vendorId ?? undefined);

    // Check low-stock going back above threshold → no notification needed here
    await logAdminAction({
      adminId,
      action: "RECEIVE_STOCK",
      entity: "Product",
      entityId: productId,
      prevValue: String(product.stock),
      newValue: String(product.stock + qty),
      note,
    });

    return { success: true, newStock: product.stock + qty };
  });
}

/**
 * Reserve stock when an order is created.
 * Returns false if insufficient available stock.
 */
export async function reserveStock(
  tx: any,
  productId: string,
  qty: number,
  orderId: string,
  performedBy: string
): Promise<boolean> {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) return false;

  const available = product.stock - product.reservedStock;
  if (available < qty) return false;

  await tx.product.update({
    where: { id: productId },
    data: { reservedStock: { increment: qty } },
  });

  await createMovement(tx, productId, "reserved", qty, performedBy, `Reserved for order ${orderId}`, orderId, product.vendorId ?? undefined);

  return true;
}

/**
 * Release reserved stock (on cancellation / rejection before shipment).
 */
export async function releaseStock(
  tx: any,
  productId: string,
  qty: number,
  orderId: string,
  performedBy: string,
  note?: string
) {
  await tx.product.update({
    where: { id: productId },
    data: { reservedStock: { decrement: qty } },
  });

  await createMovement(tx, productId, "released", qty, performedBy, note ?? `Released from order ${orderId}`, orderId);
}

/**
 * Mark stock as sold when order is delivered (deduct from physical + reserved).
 */
export async function soldStock(
  tx: any,
  productId: string,
  qty: number,
  orderId: string
) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const newStock = Math.max(0, product.stock - qty);
  const newReserved = Math.max(0, product.reservedStock - qty);

  await tx.product.update({
    where: { id: productId },
    data: {
      stock: newStock,
      reservedStock: newReserved,
      soldQty: { increment: qty },
      isActive: newStock > 0,
    },
  });

  await createMovement(tx, productId, "sold", qty, "system", `Sold via order ${orderId}`, orderId);

  // Low-stock notification
  if (newStock > 0 && newStock <= product.lowStockThreshold) {
    await tx.notification.create({
      data: {
        target: "admin",
        title: "⚠️ Low Stock Alert",
        message: `${product.title} has only ${newStock} units remaining (threshold: ${product.lowStockThreshold}).`,
        type: "warning",
      },
    });
    if (product.vendorId) {
      await tx.notification.create({
        data: {
          target: product.vendorId,
          title: "⚠️ Low Stock Alert",
          message: `Your product "${product.title}" has only ${newStock} units remaining. Please arrange a restock.`,
          type: "warning",
        },
      });
    }
  }

  // Out of stock notification
  if (newStock === 0) {
    await tx.notification.create({
      data: {
        target: "admin",
        title: "🚫 Out of Stock",
        message: `${product.title} is now OUT OF STOCK.`,
        type: "error",
      },
    });
  }
}

/**
 * Record damaged stock (reduces physical stock without affecting reserved).
 */
export async function recordDamagedStock(productId: string, qty: number, note: string) {
  const session = await getServerSession(authOptions);
  const adminId = session?.user?.id || "admin";
  if (session?.user?.role && session.user.role !== "admin") throw new Error("Unauthorized");

  return await db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");
    if (qty > product.stock) throw new Error("Cannot damage more than physical stock");

    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: qty } },
    });

    await createMovement(tx, productId, "damaged", -qty, adminId, note, undefined, product.vendorId ?? undefined);

    await logAdminAction({
      adminId,
      action: "RECORD_DAMAGED_STOCK",
      entity: "Product",
      entityId: productId,
      prevValue: String(product.stock),
      newValue: String(product.stock - qty),
      note,
    });

    return { success: true };
  });
}

/**
 * Manual stock adjustment by admin.
 */
export async function adjustStock(productId: string, delta: number, note: string) {
  const session = await getServerSession(authOptions);
  const adminId = session?.user?.id || "admin";
  if (session?.user?.role && session.user.role !== "admin") throw new Error("Unauthorized");

  return await db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    const newStock = product.stock + delta;
    if (newStock < 0) throw new Error("Stock cannot go below 0");

    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock, isActive: newStock > 0 },
    });

    await createMovement(tx, productId, "adjusted", delta, adminId, note, undefined, product.vendorId ?? undefined);

    await logAdminAction({
      adminId,
      action: "ADJUST_STOCK",
      entity: "Product",
      entityId: productId,
      prevValue: String(product.stock),
      newValue: String(newStock),
      note,
    });

    return { success: true, newStock };
  });
}

/**
 * Get stock movements for a product (admin or vendor).
 */
export async function getStockMovements(productId: string, limit = 50) {
  return await db.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get vendor warehouse summary.
 */
export async function getVendorInventorySummary(vendorId?: string) {
  const session = await getServerSession(authOptions);
  const vid = vendorId ?? session?.user?.vendorId ?? "v1";

  const products = await db.product.findMany({
    where: { vendorId: vid },
    select: {
      id: true,
      title: true,
      sku: true,
      stock: true,
      reservedStock: true,
      soldQty: true,
      lowStockThreshold: true,
      isActive: true,
    },
  });

  const summary = {
    totalPhysical: products.reduce((s, p) => s + p.stock, 0),
    totalAvailable: products.reduce((s, p) => s + Math.max(0, p.stock - p.reservedStock), 0),
    totalReserved: products.reduce((s, p) => s + p.reservedStock, 0),
    totalSold: products.reduce((s, p) => s + p.soldQty, 0),
    lowStockCount: products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
    outOfStockCount: products.filter(p => p.stock === 0).length,
    products,
  };

  return summary;
}
