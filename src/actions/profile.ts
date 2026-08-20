"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { logAdminAction } from "./audit";

/**
 * Update vendor profile (all fields including pickup/return addresses).
 * Logo is stored as a base64 data URL (or Cloudinary URL in production).
 */
export async function updateVendorProfileAction(data: {
  brandName?: string;
  name?: string;
  phone?: string;
  email?: string;
  ownerName?: string;
  cnicNumber?: string;
  businessAddress?: string;
  // Pickup address
  pickupPersonName?: string;
  pickupPhone?: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupArea?: string;
  postalCode?: string;
  // Return address
  returnAddress?: string;
  returnCity?: string;
  returnContact?: string;
  returnPhone?: string;
  // Bank/payment
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  brandLogo?: string; // base64 dataUrl or URL
}) {
  const session = await getServerSession(authOptions);
  let vendorId = session?.user?.vendorId;

  if (session?.user?.email && !vendorId) {
    const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
    if (dbUser?.vendorId) vendorId = dbUser.vendorId;
  }

  if (!vendorId) throw new Error("Not authenticated as vendor");

  // Upload logo to Cloudinary if it's a base64 data URL
  let logoUrl = data.brandLogo;
  if (logoUrl && logoUrl.startsWith("data:image")) {
    try {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      logoUrl = await uploadToCloudinary(logoUrl, "pakdropship/vendor-logos");
    } catch (e) {
      console.error("Cloudinary upload failed, storing data URL:", e);
    }
  }

  const updateData: Record<string, any> = {};
  // Only set fields that are provided
  if (data.brandName) updateData.brandName = data.brandName;
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.ownerName !== undefined) updateData.ownerName = data.ownerName;
  if (data.cnicNumber !== undefined) updateData.cnicNumber = data.cnicNumber;
  if (data.businessAddress !== undefined) updateData.businessAddress = data.businessAddress;
  // Pickup
  if (data.pickupPersonName !== undefined) updateData.pickupPersonName = data.pickupPersonName;
  if (data.pickupPhone !== undefined) updateData.pickupPhone = data.pickupPhone;
  if (data.pickupAddress !== undefined) updateData.pickupAddress = data.pickupAddress;
  if (data.pickupCity !== undefined) updateData.pickupCity = data.pickupCity;
  if (data.pickupArea !== undefined) updateData.pickupArea = data.pickupArea;
  if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
  // Return
  if (data.returnAddress !== undefined) updateData.returnAddress = data.returnAddress;
  if (data.returnCity !== undefined) updateData.returnCity = data.returnCity;
  if (data.returnContact !== undefined) updateData.returnContact = data.returnContact;
  if (data.returnPhone !== undefined) updateData.returnPhone = data.returnPhone;
  // Bank
  if (data.bankName) updateData.bankName = data.bankName;
  if (data.accountName) updateData.accountName = data.accountName;
  if (data.accountNumber) updateData.accountNumber = data.accountNumber;
  if (data.iban !== undefined) updateData.iban = data.iban;
  if (logoUrl !== undefined) updateData.brandLogo = logoUrl;

  const updated = await db.vendor.update({
    where: { id: vendorId },
    data: updateData,
  });

  return updated;
}

/**
 * Update reseller profile (brand name, phone, logo).
 */
export async function updateResellerProfileAction(data: {
  brandName?: string;
  phone?: string;
  brandLogo?: string;
}) {
  const session = await getServerSession(authOptions);
  let resellerId = session?.user?.resellerId;

  if (session?.user?.email && !resellerId) {
    const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
    if (dbUser?.resellerId) resellerId = dbUser.resellerId;
  }

  if (!resellerId) throw new Error("Not authenticated as reseller");

  // Upload logo to Cloudinary if it's a base64 data URL
  let logoUrl = data.brandLogo;
  if (logoUrl && logoUrl.startsWith("data:image")) {
    try {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      logoUrl = await uploadToCloudinary(logoUrl, "pakdropship/logos");
    } catch (e) {
      console.error("Cloudinary upload failed, storing data URL:", e);
      // Falls back to storing the data URL if Cloudinary is not configured
    }
  }

  const updated = await db.reseller.update({
    where: { id: resellerId },
    data: {
      ...(data.brandName && { brandName: data.brandName }),
      ...(data.phone && { phone: data.phone }),
      ...(logoUrl !== undefined && { brandLogo: logoUrl }),
    },
  });

  return updated;
}
