"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAdminAction } from "./audit";

type ImportRow = {
  sku?: string;
  title?: string;
  category?: string;
  vendor?: string;
  wholesale?: string;
  suggested?: string;
  stock?: string;
  weight?: string;
  description?: string;
  images?: string;   // comma-separated URLs
  colors?: string;   // comma-separated
  sizes?: string;    // comma-separated
};

export type ImportResult = {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; sku: string; error: string }[];
};

/**
 * Bulk import products from CSV data (parsed on client with PapaParse, sent as JSON array).
 * Server validates and inserts — deduplicates by SKU (title used as SKU if no sku field).
 */
export async function bulkImportProducts(rows: ImportRow[]): Promise<ImportResult> {
  const session = await getServerSession(authOptions);
  const adminId = session?.user?.id || "admin";
  if (session?.user?.role && session.user.role !== "admin") {
    throw new Error("Only admins can import products.");
  }

  const result: ImportResult = {
    total: rows.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  // Load categories + vendors for matching
  const categories = await db.category.findMany();
  const vendors = await db.vendor.findMany();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed, row 1 = header
    const sku = (row.sku || row.title || "").trim();

    try {
      if (!row.title?.trim()) throw new Error("Missing product title");
      if (!row.wholesale || isNaN(Number(row.wholesale))) throw new Error("Invalid wholesale price");
      if (!row.suggested || isNaN(Number(row.suggested))) throw new Error("Invalid suggested price");

      // Find or fallback category
      let category = categories.find(
        (c) => c.title.toLowerCase() === (row.category || "").toLowerCase()
      );
      if (!category) category = categories[0]; // fallback to first category
      if (!category) throw new Error("No categories available");

      // Find vendor if provided
      let vendorId: string | null = null;
      if (row.vendor) {
        const vendor = vendors.find(
          (v) => v.name.toLowerCase() === row.vendor!.toLowerCase() ||
                 v.brandName.toLowerCase() === row.vendor!.toLowerCase()
        );
        vendorId = vendor?.id ?? null;
      }

      // Check duplicate by title (used as unique identifier since no formal SKU field yet)
      const existing = await db.product.findFirst({
        where: { title: row.title.trim() },
      });
      if (existing) throw new Error(`Product with title "${row.title.trim()}" already exists`);

      const imageArr = row.images
        ? row.images.split(",").map((u) => u.trim()).filter(Boolean)
        : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=70"];
      const colorArr = row.colors ? row.colors.split(",").map((c) => c.trim()).filter(Boolean) : [];
      const sizeArr = row.sizes ? row.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [];

      await db.product.create({
        data: {
          vendorId,
          categoryId: category.id,
          title: row.title.trim(),
          description: row.description || "",
          images: JSON.stringify(imageArr),
          colors: JSON.stringify(colorArr),
          sizes: JSON.stringify(sizeArr),
          colorPricing: JSON.stringify({}),
          sizePricing: JSON.stringify({}),
          wholesale: Number(row.wholesale),
          suggested: Number(row.suggested),
          stock: row.stock ? parseInt(row.stock, 10) : 0,
          approvalStatus: "APPROVED",
          isActive: true,
        },
      });

      result.success++;
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: rowNum, sku, error: err.message || "Unknown error" });
    }
  }

  await logAdminAction({
    adminId,
    action: "BULK_IMPORT_PRODUCTS",
    entity: "Product",
    entityId: "bulk",
    newValue: `${result.success} success, ${result.failed} failed`,
  });

  return result;
}
