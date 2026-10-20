import "server-only";

import { ObjectId } from "mongodb";
import { connection } from "next/server";
import { getDb } from "./mongodb";

export type Lead = {
  _id: string;
  name: string;
  phone: string | null;
  preferredContactMethod: string | null;
  preferredContactTime: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertyUrl: string | null;
  active: boolean;
  createdAt: string | null;
};

function serialize(doc: Record<string, unknown> & { _id: ObjectId }): Lead {
  const created = doc.createdAt;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    _id: doc._id.toString(),
    name: String(doc.name ?? ""),
    phone: str(doc.phone),
    preferredContactMethod: str(doc.preferredContactMethod),
    preferredContactTime: str(doc.preferredContactTime),
    propertyId: str(doc.propertyId),
    propertyTitle: str(doc.propertyTitle),
    propertyUrl: str(doc.propertyUrl),
    active: doc.active !== false,
    createdAt:
      created instanceof Date
        ? created.toISOString()
        : typeof created === "string"
          ? created
          : null,
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  await connection();
  const db = await getDb();
  const docs = await db
    .collection("leads")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(serialize);
}

export async function getActiveLeadsCount(): Promise<number> {
  await connection();
  const db = await getDb();
  return db.collection("leads").countDocuments({
    active: { $ne: false },
  });
}
