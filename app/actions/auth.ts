"use server";

import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { getDb } from "@/app/lib/mongodb";
import { createSession, deleteSession } from "@/app/lib/session";

export type LoginState = { error?: string } | undefined;
export type ForgotState =
  | { error?: string; sent?: boolean; email?: string }
  | undefined;
export type ResetState = { error?: string; success?: boolean } | undefined;

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

async function sendOtpEmail(email: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set in .env");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "Property Karobari <onboarding@resend.dev>",
    to: email,
    subject: "Your admin password reset code",
    html: `<p>Your Property Karobari admin password reset code is <strong style="font-size:18px;letter-spacing:2px">${otp}</strong>.</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });

  if (error) throw new Error(error.message);
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const db = await getDb();
  const admin = await db.collection("admins").findOne({ email });

  // Support bcrypt-hashed passwords (created by scripts/create-admin.mjs)
  // as well as plain-text passwords stored directly in the collection.
  const stored = typeof admin?.password === "string" ? admin.password : "";
  const passwordMatches = stored.startsWith("$2")
    ? await bcrypt.compare(password, stored)
    : password !== "" && password === stored;

  if (!admin || !passwordMatches) {
    return { error: "Invalid email or password." };
  }

  await createSession(admin._id, admin.email);
  redirect("/admin/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/admin");
}

export async function requestPasswordReset(
  _prevState: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Email is required." };
  }

  const db = await getDb();
  const admin = await db.collection("admins").findOne({ email });

  // Return success either way so the response doesn't reveal
  // whether an admin exists for this email.
  if (!admin) {
    return { sent: true, email };
  }

  const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");

  await db.collection("password_resets").updateOne(
    { email },
    {
      $set: {
        otpHash: hashOtp(otp),
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  try {
    await sendOtpEmail(email, otp);
  } catch {
    return { error: "Failed to send the reset email. Try again later." };
  }

  return { sent: true, email };
}

export async function resetPassword(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const otp = String(formData.get("otp") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !otp) {
    return { error: "Email and reset code are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const db = await getDb();
  const record = await db.collection("password_resets").findOne({ email });

  if (
    !record ||
    record.expiresAt < new Date() ||
    (record.attempts ?? 0) >= OTP_MAX_ATTEMPTS ||
    record.otpHash !== hashOtp(otp)
  ) {
    if (record) {
      await db
        .collection("password_resets")
        .updateOne({ email }, { $inc: { attempts: 1 } });
    }
    return { error: "Invalid or expired code. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .collection("admins")
    .updateOne(
      { email },
      { $set: { password: passwordHash, updatedAt: new Date() } },
    );
  await db.collection("password_resets").deleteOne({ email });
  // Invalidate existing admin sessions for this email.
  await db.collection("sessions").deleteMany({ email });

  return { success: true };
}
