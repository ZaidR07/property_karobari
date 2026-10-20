import "server-only";

import { ObjectId } from "mongodb";
import { connection } from "next/server";
import { getDb } from "./mongodb";

export type Enquiry = {
  _id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  active: boolean;
  createdAt: string | null;
};

function serialize(doc: Record<string, unknown> & { _id: ObjectId }): Enquiry {
  const created = doc.createdAt;
  return {
    _id: doc._id.toString(),
    name: String(doc.name ?? ""),
    email: typeof doc.email === "string" ? doc.email : null,
    phone: typeof doc.phone === "string" ? doc.phone : null,
    subject: typeof doc.subject === "string" ? doc.subject : null,
    message: String(doc.message ?? ""),
    // Documents written before the active flag existed count as open.
    active: doc.active !== false,
    createdAt:
      created instanceof Date
        ? created.toISOString()
        : typeof created === "string"
          ? created
          : null,
  };
}

export async function getAllEnquiries(): Promise<Enquiry[]> {
  await connection();
  const db = await getDb();
  const docs = await db
    .collection("enquiries")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(serialize);
}

export async function getOpenEnquiriesCount(): Promise<number> {
  await connection();
  const db = await getDb();
  return db.collection("enquiries").countDocuments({
    active: { $ne: false },
  });
}
