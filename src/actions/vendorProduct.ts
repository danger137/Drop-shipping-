"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAdminAction } from "./audit";

/**
 * Auto-generate a unique SKU for a vendor product.
 * Format: PD-V{vendorNum}-{categoryCode}-{sequence}
 */
async function generateSku(vendorId: string, categoryId: string): Promise<string> {
  // Count existing products for this vendor
  const vendorCount = await db.product.count({ where: { vendorId } });
  const seq = String(vendorCount + 1).padStart(3, "0");

  // Get category abbreviation
  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { title: true },
  });
  const catCode = (category?.title || "GEN")
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  // Vendor short ID
  const vShort = vendorId.substring(vendorId.length - 4).toUpperCase();

  return `PD-${vShort}-${catCode}-${seq}`;
}

/**
 * Submit a product for admin approval (vendor action).
 */
export async function submitVendorProduct(data: {
  title: string;
  categoryId: string;
  description?: string;
  brand?: string;
  hook?: string;
  images: string; // JSON array
  videoUrl?: string;
  colors: string; // JSON array
  sizes: string; // JSON array
  colorPricing?: string;
  sizePricing?: string;
  colorImages?: string;
  wholesale: number;
  suggested: number;
  minSellingPrice?: number;
  stock: number;
  weight: number; // grams — REQUIRED
  dimensions?: string; // JSON: { l, w, h }
  returnable?: boolean;
  fragile?: boolean;
  lowStockThreshold?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.vendorId) throw new Error("Vendor not found");

  const vendorId = session.user.vendorId;

  // Validation
  if (!data.title || data.title.trim().length < 3) {
    throw new Error("Product title must be at least 3 characters");
  }
  if (!data.images || JSON.parse(data.images).length === 0) {
    throw new Error("At least 1 product image is required");
  }
  if (!data.wholesale || data.wholesale <= 0) {
    throw new Error("Wholesale price must be greater than 0");
  }
  if (!data.suggested || data.suggested <= data.wholesale) {
    throw new Error("Suggested selling price must be greater than wholesale price");
  }
  if (data.minSellingPrice && data.minSellingPrice < data.wholesale) {
    throw new Error("Minimum selling price cannot be less than wholesale price");
  }
  if (!data.weight || data.weight <= 0) {
    throw new Error("Product weight (in grams) is required");
  }
  if (data.stock < 0) {
    throw new Error("Stock cannot be negative");
  }

  // Auto-generate SKU
  const sku = await generateSku(vendorId, data.categoryId);

  const product = await db.product.create({
    data: {
      sku,
      vendorId,
      categoryId: data.categoryId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      brand: data.brand?.trim() || null,
      hook: data.hook?.trim() || null,
      images: data.images,
      videoUrl: data.videoUrl || null,
      colors: data.colors || "[]",
      sizes: data.sizes || "[]",
      colorPricing: data.colorPricing || null,
      sizePricing: data.sizePricing || null,
      colorImages: data.colorImages || null,
      wholesale: data.wholesale,
      suggested: data.suggested,
      minSellingPrice: data.minSellingPrice || null,
      stock: data.stock,
      weight: data.weight,
      dimensions: data.dimensions || null,
      returnable: data.returnable ?? true,
      fragile: data.fragile ?? false,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      approvalStatus: "PENDING_ADMIN_APPROVAL",
      isActive: false,
    },
  });

  // Notify admin
  await db.notification.create({
    data: {
      target: "admin",
      title: "📦 New Product Submitted",
      message: `Vendor submitted "${data.title}" (SKU: ${sku}) for approval.`,
      type: "info",
    },
  });

  return product;
}

/**
 * Admin approves a vendor product — makes it active and visible.
 */
export async function approveVendorProduct(productId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { title: true, vendorId: true, approvalStatus: true },
  });
  if (!product) throw new Error("Product not found");

  await db.product.update({
    where: { id: productId },
    data: {
      approvalStatus: "APPROVED",
      isActive: true,
      rejectionReason: null,
    },
  });

  // Notify vendor
  if (product.vendorId) {
    await db.notification.create({
      data: {
        target: product.vendorId,
        title: "✅ Product Approved",
        message: `Your product "${product.title}" has been approved and is now live.`,
        type: "success",
      },
    });
  }

  await logAdminAction({
    adminId: session.user.id || "admin",
    action: "APPROVE_PRODUCT",
    entity: "Product",
    entityId: productId,
    prevValue: product.approvalStatus,
    newValue: "APPROVED",
  });

  return { success: true };
}

/**
 * Admin rejects a vendor product with a reason.
 */
export async function rejectVendorProduct(productId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  if (!reason || reason.trim().length < 5) {
    throw new Error("Rejection reason must be at least 5 characters");
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { title: true, vendorId: true, approvalStatus: true },
  });
  if (!product) throw new Error("Product not found");

  await db.product.update({
    where: { id: productId },
    data: {
      approvalStatus: "REJECTED",
      isActive: false,
      rejectionReason: reason.trim(),
    },
  });

  if (product.vendorId) {
    await db.notification.create({
      data: {
        target: product.vendorId,
        title: "❌ Product Rejected",
        message: `Your product "${product.title}" was rejected. Reason: ${reason}`,
        type: "error",
      },
    });
  }

  await logAdminAction({
    adminId: session.user.id || "admin",
    action: "REJECT_PRODUCT",
    entity: "Product",
    entityId: productId,
    prevValue: product.approvalStatus,
    newValue: "REJECTED",
    note: reason,
  });

  return { success: true };
}

/**
 * Admin requests changes on a vendor product.
 */
export async function requestChangesVendorProduct(productId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { title: true, vendorId: true },
  });
  if (!product) throw new Error("Product not found");

  await db.product.update({
    where: { id: productId },
    data: {
      approvalStatus: "CHANGES_REQUESTED",
      isActive: false,
      rejectionReason: reason.trim(),
    },
  });

  if (product.vendorId) {
    await db.notification.create({
      data: {
        target: product.vendorId,
        title: "🔄 Changes Requested",
        message: `Admin requested changes on "${product.title}": ${reason}`,
        type: "warning",
      },
    });
  }

  return { success: true };
}

/**
 * Vendor updates a product that has been rejected or needs changes.
 * Resubmits for approval automatically.
 */
export async function resubmitVendorProduct(productId: string, updates: {
  title?: string;
  description?: string;
  brand?: string;
  images?: string;
  videoUrl?: string;
  wholesale?: number;
  suggested?: number;
  minSellingPrice?: number;
  stock?: number;
  weight?: number;
  returnable?: boolean;
  fragile?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.vendorId) throw new Error("Vendor not found");

  const product = await db.product.findUnique({
    where: { id: productId },
  });
  if (!product) throw new Error("Product not found");
  if (product.vendorId !== session.user.vendorId) throw new Error("Not your product");

  if (!["REJECTED", "CHANGES_REQUESTED"].includes(product.approvalStatus)) {
    throw new Error("Product cannot be resubmitted in current status");
  }

  await db.product.update({
    where: { id: productId },
    data: {
      ...updates,
      approvalStatus: "PENDING_ADMIN_APPROVAL",
      rejectionReason: null,
    },
  });

  await db.notification.create({
    data: {
      target: "admin",
      title: "📦 Product Resubmitted",
      message: `Vendor resubmitted "${updates.title || product.title}" for approval.`,
      type: "info",
    },
  });

  return { success: true };
}
