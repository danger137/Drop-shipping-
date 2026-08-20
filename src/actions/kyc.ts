"use server";

import { db } from "@/lib/db";
import { type KycRequest } from "@/lib/store";
import bcrypt from "bcrypt";
import vision from "@google-cloud/vision";

// Initialize the Google Cloud Vision client
// This will automatically pick up GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY from process.env
const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
});

export async function submitKycAction(data: Omit<KycRequest, "id" | "status" | "date">) {
  if (!data.cnic) {
    throw new Error("CNIC / ID Card Number is required.");
  }

  // --- 1. STRICT DUPLICATE CHECKS ---

  // Check Users table for duplicates (CNIC, Email)
  const existingUser = await db.user.findFirst({
    where: { 
      OR: [
        { cnic: data.cnic },
        { email: data.email }
      ]
    },
  });

  if (existingUser) {
    if (existingUser.cnic === data.cnic) throw new Error("An account with this CNIC already exists.");
    if (existingUser.email === data.email) throw new Error("This email is already registered.");
  }

  // Check KycRequests table for duplicates (CNIC, Email, Phone)
  const existingKyc = await db.kycRequest.findFirst({
    where: {
      OR: [
        { cnic: data.cnic },
        { email: data.email },
        { phone: data.phone }
      ]
    },
  });

  if (existingKyc) {
    if (existingKyc.status === "Pending") {
      throw new Error("A KYC application with these details is already pending review.");
    }
    if (existingKyc.status === "Approved") {
      throw new Error("An account with these details is already approved.");
    }
    // If Rejected, they can try again.
  }

  // Check Reseller/Vendor tables for duplicate phone
  const existingResellerPhone = await db.reseller.findFirst({ where: { phone: data.phone } });
  const existingVendorPhone = await db.vendor.findFirst({ where: { phone: data.phone } });
  
  if (existingResellerPhone || existingVendorPhone) {
    throw new Error("This phone number is already attached to an existing account.");
  }

  // --- 2. OCR VERIFICATION WITH GOOGLE VISION ---
  if (data.idFront && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      // Strip base64 metadata (e.g. "data:image/jpeg;base64,")
      const base64Data = data.idFront.replace(/^data:image\/\w+;base64,/, "");
      
      const [result] = await visionClient.textDetection({
        image: { content: base64Data }
      });
      
      const text = result.fullTextAnnotation?.text || "";
      
      // Clean up the text to make matching easier (remove spaces and dashes)
      const cleanText = text.replace(/[\s-]/g, "");
      const cleanInputCnic = data.cnic.replace(/[\s-]/g, "");
      
      if (!cleanText.includes(cleanInputCnic)) {
        throw new Error("OCR Verification Failed: The provided CNIC number was not found on the uploaded ID card.");
      }
    } catch (error: any) {
      if (error.message.includes("OCR Verification Failed")) {
        throw error; // Re-throw our custom error
      }
      console.error("Google Vision API Error:", error);
      throw new Error("Failed to verify ID card image. Please ensure the image is clear or try again later.");
    }
  }

  // --- 3. UPLOAD IMAGES TO CLOUDINARY ---
  let idFrontUrl = data.idFront;
  let idBackUrl = data.idBack;

  if (data.idFront && data.idFront.startsWith("data:image")) {
    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    idFrontUrl = await uploadToCloudinary(data.idFront, "pakdropship/kyc");
  }

  if (data.idBack && data.idBack.startsWith("data:image")) {
    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    idBackUrl = await uploadToCloudinary(data.idBack, "pakdropship/kyc");
  }

  // --- 4. CREATE KYC REQUEST ---
  const hashedPassword = await bcrypt.hash(data.passwordHash, 10);

  const newKyc = await db.kycRequest.create({
    data: {
      email: data.email,
      passwordHash: hashedPassword,
      name: data.name,
      phone: data.phone,
      cnic: data.cnic,
      idFront: idFrontUrl,
      idBack: idBackUrl,
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      iban: data.iban,
      accountType: data.accountType,
      status: "Pending",
    },
  });

  return { success: true, id: newKyc.id };
}

export async function processKycAction(kycId: string, approve: boolean, adminName: string) {
  const kyc = await db.kycRequest.findUnique({ where: { id: kycId } });
  if (!kyc) throw new Error("KYC Request not found");
  if (kyc.status !== "Pending") throw new Error(`KYC is already ${kyc.status}`);

  if (!approve) {
    await db.kycRequest.update({
      where: { id: kycId },
      data: { status: "Rejected", reviewedBy: adminName },
    });
    return { success: true };
  }

  // --- APPROVE ---
  // 1. Create Reseller or Vendor
  let resellerId = null;
  let vendorId = null;

  if (kyc.accountType === "reseller") {
    const reseller = await db.reseller.create({
      data: {
        name: kyc.name,
        brandName: `${kyc.name}'s Store`,
        phone: kyc.phone,
      },
    });
    resellerId = reseller.id;
  } else if (kyc.accountType === "vendor") {
    const vendor = await db.vendor.create({
      data: {
        name: kyc.name,
        brandName: `${kyc.name}'s Supply`,
        phone: kyc.phone,
        bankName: kyc.bankName,
        accountName: kyc.accountName,
        accountNumber: kyc.accountNumber,
      },
    });
    vendorId = vendor.id;
  }

  // 2. Upsert User (in case they already exist, e.g. an admin approving their own test request)
  const existingUser = await db.user.findUnique({ where: { email: kyc.email } });
  
  if (existingUser) {
    await db.user.update({
      where: { email: kyc.email },
      data: {
        role: kyc.accountType,
        resellerId,
        vendorId,
      },
    });
  } else {
    await db.user.create({
      data: {
        email: kyc.email,
        passwordHash: kyc.passwordHash,
        role: kyc.accountType,
        resellerId,
        vendorId,
      },
    });
  }

  // 3. Update KYC Status
  await db.kycRequest.update({
    where: { id: kycId },
    data: { status: "Approved", reviewedBy: adminName },
  });

  return { success: true };
}
