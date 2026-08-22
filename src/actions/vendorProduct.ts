"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAdminAction } from "./audit";
import nodemailer from "nodemailer";

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
  return `PD-V${vShort}-${catCode}-${seq}`;
}

/**
 * Helper to resolve vendor email and name from either Vendor or User model
 */
async function resolveVendorEmail(vendorId: string): Promise<{ email: string | null; name: string }> {
  try {
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      select: { email: true, name: true, brandName: true }
    });
    if (vendor?.email && vendor.email.includes("@")) {
      return { email: vendor.email, name: vendor.name || vendor.brandName || "Vendor" };
    }

    const user = await db.user.findFirst({
      where: { vendorId },
      select: { email: true }
    });
    if (user?.email && user.email.includes("@")) {
      return { email: user.email, name: vendor?.name || "Vendor" };
    }

    return { email: vendor?.email || user?.email || null, name: vendor?.name || "Vendor" };
  } catch (e) {
    console.error("Error resolving vendor email:", e);
    return { email: null, name: "Vendor" };
  }
}

/**
 * Submit a product for admin approval (vendor action).
 */
export async function submitVendorProduct(data: {
  title: string;
  categoryId: string;
  vendorId?: string;
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
  const vendorId = session?.user?.vendorId || data.vendorId;
  if (!vendorId) throw new Error("Vendor not found");

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

  // Notify admin in-app
  await db.notification.create({
    data: {
      target: "admin",
      title: "📦 New Product Submitted",
      message: `Vendor submitted "${data.title}" (SKU: ${sku}) for approval.`,
      type: "info",
    },
  });

  // Send Email to Vendor
  try {
    const vendorEmail = session?.user?.email;
    const vendorName = session?.user?.name || "Vendor";

    if (vendorEmail) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
        to: vendorEmail,
        subject: "Product Submitted for Approval - PakDropship",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b; text-align: center;">Product Pending Approval ⏳</h2>
            <p>Dear <strong>${vendorName}</strong>,</p>
            <p>Thank you for submitting a new product to PakDropship.</p>
            <p>Your product <strong>"${data.title}"</strong> (SKU: ${sku}) has been successfully uploaded and is currently <strong>Pending Admin Approval</strong>.</p>
            <p>Our admin team has been notified and will review your product shortly. Once it is approved, it will automatically go live on the platform for resellers to sell.</p>
            <p>We will notify you again once the status of your product changes.</p>
            <br>
            <p>Best Regards,</p>
            <p><strong>The PakDropship Team</strong></p>
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      }
    }
  } catch (emailError) {
    console.error("Failed to send product pending email:", emailError);
  }

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

    try {
      const { email: vendorEmail, name: vendorName } = await resolveVendorEmail(product.vendorId);

      if (vendorEmail) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "465"),
          secure: true,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
          to: vendorEmail,
          subject: "Product Approved - PakDropship",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #10b981; text-align: center;">Product Approved! 🎉</h2>
              <p>Dear <strong>${vendorName}</strong>,</p>
              <p>Great news! Your product <strong>"${product.title}"</strong> has been approved by our admin team.</p>
              <p>It is now live on PakDropship and available for resellers to add to their stores and sell.</p>
              <p>Keep adding great products and grow your sales!</p>
              <br>
              <p>Best Regards,</p>
              <p><strong>The PakDropship Team</strong></p>
            </div>
          `,
        });
      }
    } catch (e) {
      console.error("Failed to send product approval email:", e);
    }
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

    try {
      const { email: vendorEmail, name: vendorName } = await resolveVendorEmail(product.vendorId);

      if (vendorEmail) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "465"),
          secure: true,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
          to: vendorEmail,
          subject: "Product Rejected - PakDropship",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #ef4444; text-align: center;">Product Rejected ❌</h2>
              <p>Dear <strong>${vendorName}</strong>,</p>
              <p>Your submitted product <strong>"${product.title}"</strong> was reviewed and could not be approved at this time.</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p>Please update the product according to the feedback and resubmit it for approval.</p>
              <br>
              <p>Best Regards,</p>
              <p><strong>The PakDropship Team</strong></p>
            </div>
          `,
        });
      }
    } catch (e) {
      console.error("Failed to send product rejection email:", e);
    }
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

/**
 * Request an edit for an existing product (Requires Admin Approval)
 */
export async function requestProductEdit(productId: string, requestedData: any) {
  const session = await getServerSession(authOptions);
  
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const vendorId = session?.user?.vendorId || product.vendorId;
  if (!vendorId) throw new Error("Vendor not found");

  if (session?.user?.role !== "admin" && product.vendorId !== vendorId) {
    throw new Error("Unauthorized");
  }

  const existingRequest = await (db as any).productActionRequest.findFirst({
    where: { productId, status: "PENDING" }
  });

  if (existingRequest) {
    throw new Error("A pending request already exists for this product.");
  }

  const req = await (db as any).productActionRequest.create({
    data: {
      productId,
      vendorId,
      type: "EDIT",
      requestedData: JSON.stringify(requestedData),
    }
  });

  await db.notification.create({
    data: {
      target: "admin",
      title: "📝 Product Edit Request",
      message: `Vendor requested an edit for product "${product.title}".`,
      type: "info",
    },
  });

  // Send Email to Vendor (Pending Edit Request)
  try {
    const { email: vendorEmail, name: vendorName } = await resolveVendorEmail(vendorId);

    if (vendorEmail) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
        to: vendorEmail,
        subject: "Product Edit Request Submitted - PakDropship",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b; text-align: center;">Edit Request Pending ⏳</h2>
            <p>Dear <strong>${vendorName}</strong>,</p>
            <p>Your request to edit the product <strong>"${product.title}"</strong> has been submitted successfully.</p>
            <p>Our admin team will review your requested changes shortly. The product will continue to show its original details until the changes are approved.</p>
            <p>We will notify you via email once the admin approves or rejects your request.</p>
            <br>
            <p>Best Regards,</p>
            <p><strong>The PakDropship Team</strong></p>
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      }
    }
  } catch (emailError) {
    console.error("Failed to send product edit request email:", emailError);
  }

  return req;
}

/**
 * Request to delete an existing product (Requires Admin Approval)
 */
export async function requestProductDelete(productId: string) {
  const session = await getServerSession(authOptions);
  
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const vendorId = session?.user?.vendorId || product.vendorId;
  if (!vendorId) throw new Error("Vendor not found");

  if (session?.user?.role !== "admin" && product.vendorId !== vendorId) {
    throw new Error("Unauthorized");
  }

  const existingRequest = await (db as any).productActionRequest.findFirst({
    where: { productId, status: "PENDING" }
  });

  if (existingRequest) {
    throw new Error("A pending request already exists for this product.");
  }

  const req = await (db as any).productActionRequest.create({
    data: {
      productId,
      vendorId,
      type: "DELETE",
    }
  });

  await db.notification.create({
    data: {
      target: "admin",
      title: "🗑️ Product Delete Request",
      message: `Vendor requested to delete product "${product.title}".`,
      type: "warning",
    },
  });

  // Send Email to Vendor (Pending Delete Request)
  try {
    const { email: vendorEmail, name: vendorName } = await resolveVendorEmail(vendorId);

    if (vendorEmail) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
        to: vendorEmail,
        subject: "Product Delete Request Submitted - PakDropship",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b; text-align: center;">Delete Request Pending ⏳</h2>
            <p>Dear <strong>${vendorName}</strong>,</p>
            <p>Your request to delete the product <strong>"${product.title}"</strong> has been submitted successfully.</p>
            <p>Our admin team will review your request shortly. Once approved, the product will be removed from the platform.</p>
            <p>We will notify you via email once the admin takes action on your request.</p>
            <br>
            <p>Best Regards,</p>
            <p><strong>The PakDropship Team</strong></p>
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      }
    }
  } catch (emailError) {
    console.error("Failed to send product delete request email:", emailError);
  }

  return req;
}

/**
 * Admin approves a product edit or delete request
 */
export async function approveProductAction(requestId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  const req = await (db as any).productActionRequest.findUnique({
    where: { id: requestId },
    include: { product: true, vendor: true }
  });

  if (!req) throw new Error("Request not found");
  if (req.status !== "PENDING") {
    return { success: true };
  }

  if (req.type === "EDIT" && req.requestedData) {
    const rawData = JSON.parse(req.requestedData);
    const updateData: any = { ...rawData };

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.vendor;
    delete updateData.category;
    delete updateData.vendorId;

    if (updateData.images !== undefined && typeof updateData.images !== "string") {
      updateData.images = JSON.stringify(updateData.images);
    }
    if (updateData.colors !== undefined && typeof updateData.colors !== "string") {
      updateData.colors = JSON.stringify(updateData.colors);
    }
    if (updateData.sizes !== undefined && typeof updateData.sizes !== "string") {
      updateData.sizes = JSON.stringify(updateData.sizes);
    }
    if (updateData.colorPricing !== undefined && typeof updateData.colorPricing !== "string") {
      updateData.colorPricing = JSON.stringify(updateData.colorPricing);
    }
    if (updateData.sizePricing !== undefined && typeof updateData.sizePricing !== "string") {
      updateData.sizePricing = JSON.stringify(updateData.sizePricing);
    }
    if (updateData.colorImages !== undefined && typeof updateData.colorImages !== "string") {
      updateData.colorImages = JSON.stringify(updateData.colorImages);
    }

    await db.product.update({
      where: { id: req.productId },
      data: updateData
    });
  } else if (req.type === "DELETE") {
    try {
      await (db as any).productActionRequest.deleteMany({
        where: { productId: req.productId }
      });
      await db.product.delete({
        where: { id: req.productId }
      });
    } catch (err) {
      console.warn("Hard delete failed, soft deleting product:", err);
      await db.product.update({
        where: { id: req.productId },
        data: { isActive: false, approvalStatus: "DELETED", rejectionReason: "Deleted by vendor" }
      });
    }
  }

  await (db as any).productActionRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" }
  });

  await db.notification.create({
    data: {
      target: req.vendorId,
      title: "✅ Request Approved",
      message: `Your ${req.type.toLowerCase()} request for "${req.product.title}" was approved.`,
      type: "success",
    },
  });

  // Send Email to Vendor
  try {
    const { email: vendorEmail, name: vendorName } = await resolveVendorEmail(req.vendorId);

    if (vendorEmail) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const action = req.type.toLowerCase();
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
        to: vendorEmail,
        subject: `Product ${req.type === "EDIT" ? "Edit" : "Delete"} Request Approved - PakDropship`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981; text-align: center;">Request Approved ✅</h2>
            <p>Dear <strong>${vendorName}</strong>,</p>
            <p>Your request to <strong>${action}</strong> the product <strong>"${req.product.title}"</strong> has been approved by the admin.</p>
            ${req.type === "EDIT" ? "<p>The product details have been successfully updated and are now live.</p>" : "<p>The product has been successfully removed.</p>"}
            <br>
            <p>Best Regards,</p>
            <p><strong>The PakDropship Team</strong></p>
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      }
    }
  } catch (emailError) {
    console.error("Failed to send product action approval email:", emailError);
  }

  return { success: true };
}

/**
 * Admin rejects a product edit or delete request
 */
export async function rejectProductAction(requestId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  const req = await (db as any).productActionRequest.findUnique({
    where: { id: requestId },
    include: { product: true, vendor: true }
  });

  if (!req) throw new Error("Request not found");
  if (req.status !== "PENDING") {
    return { success: true };
  }

  await (db as any).productActionRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", adminReason: reason }
  });

  await db.notification.create({
    data: {
      target: req.vendorId,
      title: "❌ Request Rejected",
      message: `Your ${req.type.toLowerCase()} request for "${req.product.title}" was rejected: ${reason}`,
      type: "error",
    },
  });

  // Send Email to Vendor
  try {
    const { email: vendorEmail, name: vendorName } = await resolveVendorEmail(req.vendorId);

    if (vendorEmail) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const action = req.type.toLowerCase();
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
        to: vendorEmail,
        subject: `Product ${req.type === "EDIT" ? "Edit" : "Delete"} Request Rejected - PakDropship`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ef4444; text-align: center;">Request Rejected ❌</h2>
            <p>Dear <strong>${vendorName}</strong>,</p>
            <p>Your request to <strong>${action}</strong> the product <strong>"${req.product.title}"</strong> was rejected by the admin.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>If you have any questions, please contact our support team.</p>
            <br>
            <p>Best Regards,</p>
            <p><strong>The PakDropship Team</strong></p>
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      }
    }
  } catch (emailError) {
    console.error("Failed to send product action rejection email:", emailError);
  }

  return { success: true };
}

/**
 * Admin directly deletes a product
 */
export async function adminDeleteProduct(productId: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");

  try {
    await (db as any).productActionRequest.deleteMany({
      where: { productId }
    });
    await db.product.delete({
      where: { id: productId }
    });
  } catch (err) {
    console.warn("Hard delete failed, soft deleting:", err);
    await db.product.update({
      where: { id: productId },
      data: { isActive: false, approvalStatus: "DELETED", rejectionReason: "Deleted by admin" }
    });
  }

  return { success: true };
}
