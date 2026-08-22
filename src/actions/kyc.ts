"use server";

import { db } from "@/lib/db";
import { type KycRequest } from "@/lib/store";
import bcrypt from "bcrypt";
import vision from "@google-cloud/vision";
import nodemailer from "nodemailer";

// Initialize the Google Cloud Vision client
// This will automatically pick up GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY from process.env
const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
});

export async function submitKycAction(data: Omit<KycRequest, "id" | "status" | "date">) {
  try {
    if (!data.cnic) {
      return { error: "CNIC / ID Card Number is required." };
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
      if (existingUser.cnic === data.cnic) return { error: "An account with this CNIC already exists." };
      if (existingUser.email === data.email) return { error: "This email is already registered." };
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
        return { error: "A KYC application with these details is already pending review." };
      }
      if (existingKyc.status === "Approved") {
        return { error: "An account with these details is already approved." };
      }
      // If Rejected, they can try again.
    }

    // Check Reseller/Vendor tables for duplicate phone
    const existingResellerPhone = await db.reseller.findFirst({ where: { phone: data.phone } });
    const existingVendorPhone = await db.vendor.findFirst({ where: { phone: data.phone } });
    
    if (existingResellerPhone || existingVendorPhone) {
      return { error: "This phone number is already attached to an existing account." };
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
          return { error: "OCR Verification Failed: The provided CNIC number was not found on the uploaded ID card." };
        }
      } catch (error: any) {
        console.error("Google Vision API Error:", error);
        return { error: "Failed to verify ID card image. Please ensure the image is clear or try again later." };
      }
    }

    // --- 3. UPLOAD IMAGES / VIDEO TO CLOUDINARY ---
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

    // Upload vendor stock video (if present)
    let stockVideoUrl: string | null = null;
    if (data.accountType === "vendor" && data.stockVideo && data.stockVideo.startsWith("data:video")) {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      stockVideoUrl = await uploadToCloudinary(data.stockVideo, "pakdropship/stock-videos");
    }

    // Upload vendor stock images (if present)
    let stockImagesJson: string | null = null;
    if (data.accountType === "vendor" && data.stockImages) {
      // stockImages is already a JSON string of base64 array from frontend
      const imagesArr: string[] = JSON.parse(data.stockImages);
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      const uploadedUrls: string[] = [];
      for (const img of imagesArr) {
        if (img && img.startsWith("data:image")) {
          const url = await uploadToCloudinary(img, "pakdropship/stock-images");
          uploadedUrls.push(url);
        } else if (img) {
          uploadedUrls.push(img);
        }
      }
      stockImagesJson = JSON.stringify(uploadedUrls);
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
        pickupAddress: data.pickupAddress,
        pickupCity: data.pickupCity,
        pickupPhone: data.pickupPhone,
        returnAddress: data.returnAddress,
        returnCity: data.returnCity,
        stockVideo: stockVideoUrl,
        stockImages: stockImagesJson,
        status: "Pending",
      },
    });

    // --- 5. SEND VERIFICATION PENDING EMAIL ---
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
        to: data.email,
        subject: "Application Under Review - PakDropship",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2e8b57; text-align: center;">PakDropship Application Received</h2>
            <p>Dear <strong>${data.name}</strong>,</p>
            <p>Thank you for applying to join PakDropship as a <strong>${data.accountType === "vendor" ? "Vendor/Supplier" : "Reseller"}</strong>.</p>
            <p>Your application and KYC documents have been successfully submitted and are currently <strong>under review</strong> by our team. This process usually takes 24 to 48 hours.</p>
            <p>Once your account is approved, you will receive another email with your login details and further instructions.</p>
            <br>
            <p>Best Regards,</p>
            <p><strong>The PakDropship Team</strong></p>
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      } else {
        console.log("Email not sent because SMTP credentials are missing in .env");
      }
    } catch (emailError) {
      console.error("Failed to send KYC pending email:", emailError);
      // Don't fail the KYC process if email fails
    }

    return { success: true, id: newKyc.id };
  } catch (err: any) {
    console.error("submitKycAction Error:", err);
    return { error: err.message || "An unexpected error occurred. Please try again." };
  }
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

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
        to: kyc.email,
        subject: "Action Required: PakDropship Application Update",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #e53e3e; text-align: center;">Application Status Update</h2>
            <p>Dear <strong>${kyc.name}</strong>,</p>
            <p>Thank you for applying to PakDropship.</p>
            <p>Unfortunately, your application for a <strong>${kyc.accountType === "vendor" ? "Vendor/Supplier" : "Reseller"}</strong> account has been <strong>declined</strong> at this time. This may be due to missing information, invalid documents, or not meeting our current criteria.</p>
            <p>If you have any questions or wish to appeal this decision, please reply to this email or contact our support team.</p>
            <br>
            <p>Best Regards,</p>
            <p><strong>The PakDropship Team</strong></p>
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      }
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

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
        brandName: kyc.name,
        phone: kyc.phone,
        bankName: kyc.bankName,
        accountName: kyc.accountName,
        accountNumber: kyc.accountNumber,
        pickupAddress: kyc.pickupAddress,
        pickupCity: kyc.pickupCity,
        pickupPhone: kyc.pickupPhone || kyc.phone,
        returnAddress: kyc.returnAddress,
        returnCity: kyc.returnCity,
        returnPhone: kyc.returnPhone || kyc.phone,
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

  // 4. Send Approval Email
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pakdropship.pk",
      to: kyc.email,
      subject: "Welcome to PakDropship! Your Account is Approved",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2e8b57; text-align: center;">Congratulations! 🎉</h2>
          <p>Dear <strong>${kyc.name}</strong>,</p>
          <p>We are thrilled to inform you that your application for a <strong>${kyc.accountType === "vendor" ? "Vendor/Supplier" : "Reseller"}</strong> account has been <strong>approved</strong>!</p>
          <p>Your account is now fully active. You can log in using the email address and password you provided during registration.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" style="background-color: #2e8b57; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Login Dashboard</a>
          </div>
          
          <p>If you have any questions, our support team is always here to help.</p>
          <br>
          <p>Best Regards,</p>
          <p><strong>The PakDropship Team</strong></p>
        </div>
      `,
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    }
  } catch (emailError) {
    console.error("Failed to send approval email:", emailError);
  }

  return { success: true };
}
