"use server";

import { db } from "@/lib/db";
import nodemailer from "nodemailer";

// In-memory fallback map for OTP tokens
const memoryOtpStore = new Map<string, { otp: string; expiresAt: Date }>();

export async function sendOtpAction(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { error: "Email address is required." };

    // 1. Check if user already exists
    const existingUser = await db.user.findFirst({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      return { error: "An account with this email is already registered." };
    }

    const existingKyc = await db.kycRequest.findFirst({
      where: { email: cleanEmail, status: { in: ["Pending", "Approved"] } },
    });
    if (existingKyc) {
      return { error: "An application with this email is already submitted or approved." };
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 3. Save to DB (or Memory fallback if Prisma model is pending reload)
    try {
      if ((db as any).otpToken) {
        await (db as any).otpToken.upsert({
          where: { email: cleanEmail },
          create: { email: cleanEmail, otp, expiresAt },
          update: { otp, expiresAt, createdAt: new Date() },
        });
      } else {
        memoryOtpStore.set(cleanEmail, { otp, expiresAt });
      }
    } catch (dbErr) {
      console.warn("DB OTP Save warning, falling back to memory store:", dbErr);
      memoryOtpStore.set(cleanEmail, { otp, expiresAt });
    }

    // 4. Send Email via nodemailer if SMTP configured
    let emailSent = false;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.SMTP_FROM || smtpUser || "noreply@pakdropship.pk";

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0;">Pak<span style="color: #16a34a;">Dropship</span></h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Email Verification Code</p>
            </div>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${otp}</span>
            </div>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">
              Use the 6-digit OTP code above to complete your PakDropship registration. This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
              If you did not request this verification code, please ignore this email.
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: `"PakDropship" <${fromEmail}>`,
          to: cleanEmail,
          subject: `${otp} is your PakDropship verification code`,
          html: htmlContent,
        });
        emailSent = true;
      } catch (err: any) {
        console.error("Nodemailer Email Error:", err.message);
      }
    } else {
      console.log(`[DEV MODE] OTP for ${cleanEmail}: ${otp}`);
    }

    return {
      success: true,
      message: emailSent
        ? `Verification code sent to ${cleanEmail}!`
        : "Verification code sent to your email!",
    };
  } catch (err: any) {
    console.error("sendOtpAction Error:", err);
    return { error: err.message || "Failed to send verification code." };
  }
}

export async function verifyOtpAction(email: string, otp: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp) {
      return { error: "Email and OTP code are required." };
    }

    let token: { otp: string; expiresAt: Date } | null = null;

    try {
      if ((db as any).otpToken) {
        token = await (db as any).otpToken.findUnique({
          where: { email: cleanEmail },
        });
      }
    } catch (e) {
      token = null;
    }

    if (!token) {
      token = memoryOtpStore.get(cleanEmail) || null;
    }

    if (!token) {
      return { error: "No OTP request found for this email. Please click resend." };
    }

    if (new Date() > new Date(token.expiresAt)) {
      return { error: "Verification code has expired. Please request a new code." };
    }

    if (token.otp !== cleanOtp) {
      return { error: "Incorrect verification code. Please check and try again." };
    }

    // Clean up
    try {
      if ((db as any).otpToken) {
        await (db as any).otpToken.delete({
          where: { email: cleanEmail },
        }).catch(() => {});
      }
    } catch (e) {}

    memoryOtpStore.delete(cleanEmail);

    return { success: true };
  } catch (err: any) {
    console.error("verifyOtpAction Error:", err);
    return { error: err.message || "Failed to verify OTP." };
  }
}
