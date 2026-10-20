"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/session";
import type { EnquiryFormState } from "./enquiries";

export async function setLeadActive(
  _prevState: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  if (!(await getSession())) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!ObjectId.isValid(id)) return { error: "Invalid lead." };

  const db = await getDb();
  await db
    .collection("leads")
    .updateOne({ _id: new ObjectId(id) }, { $set: { active } });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deleteLead(
  _prevState: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  if (!(await getSession())) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) return { error: "Invalid lead." };

  const db = await getDb();
  await db.collection("leads").deleteOne({ _id: new ObjectId(id) });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
