"use server";

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { EMPLOYEE_TYPES } from "@/app/lib/employees";
import { getDb } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/session";

export type EmployeeFormState =
  | {
      error?: string;
      success?: boolean;
      password?: string;
      email?: string;
      emailSent?: boolean;
    }
  | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z][A-Za-z .'-]{2,49}$/;
// 10-digit Indian mobile, optionally prefixed with +91 / 91 / 0.
const PHONE_RE = /^(?:91|0)?[6-9]\d{9}$/;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendCredentialsEmail(
  name: string,
  email: string,
  password: string,
  roleLabel: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const host = (await headers()).get("host");
  const loginUrl = host ? `http${host.includes("localhost") ? "" : "s"}://${host}/admin` : null;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM ||
      "Property Kaarobaari <onboarding@resend.dev>",
    to: email,
    subject: "Your Property Kaarobaari admin login credentials",
    html: `
      <h2 style="margin:0 0 12px">Welcome to Property Kaarobaari</h2>
      <p style="margin:0 0 12px">Hi ${escapeHtml(name)}, your admin account has been created as <strong>${escapeHtml(roleLabel)}</strong>.</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Password</td><td><strong>${escapeHtml(password)}</strong></td></tr>
      </table>
      ${loginUrl ? `<p style="margin:16px 0 0">Log in here: <a href="${loginUrl}">${loginUrl}</a></p>` : ""}
      <p style="margin:16px 0 0;color:#666">Please change your password after your first login.</p>
    `,
  });

  if (error) throw new Error(error.message);
}

// First four letters of the name in capitals + last four digits of the mobile.
function generatedPassword(name: string, phone: string) {
  const letters = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
  const digits = phone.replace(/\D/g, "").slice(-4);
  return `${letters}${digits}`;
}

export async function createEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authorized." };

  const db = await getDb();
  const caller = await db
    .collection("admins")
    .findOne({ email: session.email });
  // Accounts created before ranks existed count as super admin (rank 1).
  const callerRank =
    typeof caller?.rank === "number" ? caller.rank : 1;
  const callerEmployeeId = caller?.employeeId
    ? String(caller.employeeId)
    : null;

  if (callerRank > 2) {
    return { error: "Only super admins and managers can create employees." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const address = String(formData.get("address") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "").trim();
  const formManagerId = String(formData.get("managerId") ?? "").trim();

  if (!name || !phone || !email) {
    return { error: "Name, contact number and email are required." };
  }
  if (!NAME_RE.test(name)) {
    return {
      error: "Enter a valid name — at least 3 characters, letters only.",
    };
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (!PHONE_RE.test(phoneDigits)) {
    return {
      error:
        "Enter a valid 10-digit mobile number (optionally prefixed with +91).",
    };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  const typeConfig = EMPLOYEE_TYPES[type];
  if (!typeConfig) {
    return { error: "Please select a valid employee type." };
  }
  if (callerRank === 2 && type === "manager") {
    return { error: "Managers cannot create other managers." };
  }

  // Team leaders and executives report to a manager. A manager creating
  // someone can only assign them to themselves.
  const managerId = callerRank === 2 ? callerEmployeeId : formManagerId;
  let manager: { _id: ObjectId; name?: unknown } | null = null;
  if (type !== "manager") {
    if (!managerId || !ObjectId.isValid(managerId)) {
      return { error: "Please assign this employee to a manager." };
    }
    manager = await db.collection("employees").findOne({
      _id: new ObjectId(managerId),
      type: "manager",
    });
    if (!manager) {
      return { error: "Selected manager not found." };
    }
  }

  // Executives also report to a team leader under the chosen manager.
  const teamLeaderId = String(formData.get("teamLeaderId") ?? "").trim();
  let teamLeader: { _id: ObjectId; name?: unknown; managerId?: unknown } | null =
    null;
  if (type === "executive") {
    if (!ObjectId.isValid(teamLeaderId)) {
      return { error: "Please assign this executive to a team leader." };
    }
    teamLeader = await db.collection("employees").findOne({
      _id: new ObjectId(teamLeaderId),
      type: "team_leader",
    });
    if (
      !teamLeader ||
      String(teamLeader.managerId ?? "") !== String(manager?._id ?? "")
    ) {
      return { error: "Selected team leader not found under this manager." };
    }
  }

  // Store the normalized 10-digit number; its last four digits form the password.
  const normalizedPhone = phoneDigits.slice(-10);
  const password = generatedPassword(name, normalizedPhone);
  if (password.length < 8) {
    return {
      error:
        "Could not generate a password — the name needs 4 letters and the mobile 4 digits.",
    };
  }

  const existing = await db.collection("admins").findOne({ email });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  const employee = await db.collection("employees").insertOne({
    name,
    phone: normalizedPhone,
    email,
    address,
    type,
    rank: typeConfig.rank,
    managerId: manager ? manager._id : null,
    managerName: manager ? String(manager.name ?? "") : null,
    teamLeaderId: teamLeader ? teamLeader._id : null,
    teamLeaderName: teamLeader ? String(teamLeader.name ?? "") : null,
    createdAt: now,
  });

  try {
    await db.collection("admins").insertOne({
      name,
      email,
      password: passwordHash,
      role: type,
      rank: typeConfig.rank,
      employeeId: employee.insertedId,
      createdAt: now,
    });
  } catch (error) {
    await db.collection("employees").deleteOne({ _id: employee.insertedId });
    throw error;
  }

  let emailSent = false;
  try {
    await sendCredentialsEmail(name, email, password, typeConfig.label);
    emailSent = true;
  } catch (error) {
    // The employee and login already exist — report the failure so the
    // admin can share the credentials manually.
    console.error("Failed to send employee credentials email:", error);
  }

  revalidatePath("/admin/employees");
  return { success: true, password, email, emailSent };
}

export async function deleteEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) return { error: "Invalid employee." };

  const db = await getDb();
  const caller = await db
    .collection("admins")
    .findOne({ email: session.email });
  const callerRank = typeof caller?.rank === "number" ? caller.rank : 1;
  if (callerRank > 2) {
    return { error: "Only super admins and managers can delete employees." };
  }

  const employee = await db
    .collection("employees")
    .findOne({ _id: new ObjectId(id) });
  if (!employee) return { error: "Employee not found." };

  // Nobody can delete their own account.
  if (String(employee.email ?? "").toLowerCase() === session.email) {
    return { error: "You cannot delete your own account." };
  }
  // A manager can only delete members of their own team.
  if (
    callerRank === 2 &&
    String(employee.managerId ?? "") !== String(caller?.employeeId ?? "")
  ) {
    return { error: "You can only delete employees assigned to you." };
  }

  await db.collection("employees").deleteOne({ _id: new ObjectId(id) });
  // Remove the linked admin login and any active sessions.
  await db.collection("admins").deleteMany({ employeeId: new ObjectId(id) });
  await db
    .collection("sessions")
    .deleteMany({ email: String(employee.email ?? "") });

  revalidatePath("/admin/employees");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
