import "server-only";

import { ObjectId } from "mongodb";
import { connection } from "next/server";
import { getDb } from "./mongodb";
import type { PropertyRecord } from "./types";

type PropertyOptions = {
  city?: string;
  q?: string;
};

function serialize(
  doc: Record<string, unknown> & { _id: ObjectId },
): PropertyRecord {
  const parking = (doc.parking ?? {}) as Record<string, unknown>;
  const arr = (value: unknown) =>
    Array.isArray(value) ? (value as string[]) : [];
  const numOrNull = (value: unknown) =>
    typeof value === "number" ? value : null;
  const strOrNull = (value: unknown) =>
    typeof value === "string" ? value : null;

  return {
    id: doc._id.toString(),
    listingType: String(doc.listingType ?? "sale"),
    status: String(doc.status ?? "published"),
    title: strOrNull(doc.title),
    propertyType: strOrNull(doc.propertyType),
    floor: numOrNull(doc.floor),
    totalFloors: numOrNull(doc.totalFloors),
    bedrooms: strOrNull(doc.bedrooms),
    area: numOrNull(doc.area),
    areaUnit: strOrNull(doc.areaUnit),
    parking: {
      available: Boolean(parking.available),
      count: numOrNull(parking.count),
      type: strOrNull(parking.type),
    },
    constructionStatus: strOrNull(doc.constructionStatus),
    price: numOrNull(doc.price),
    deposit: numOrNull(doc.deposit),
    availableFor: arr(doc.availableFor),
    pgServices: arr(doc.pgServices),
    sharingOption: strOrNull(doc.sharingOption),
    totalCapacity: strOrNull(doc.totalCapacity),
    possessionIn: strOrNull(doc.possessionIn),
    startingFrom: numOrNull(doc.startingFrom),
    address: strOrNull(doc.address),
    city: strOrNull(doc.city),
    location: strOrNull(doc.location),
    furnishing: strOrNull(doc.furnishing),
    amenities: arr(doc.amenities),
    thumbnail: strOrNull(doc.thumbnail),
    images: arr(doc.images),
    videos: arr(doc.videos),
    brochure: strOrNull(doc.brochure),
  };
}

export async function getPublishedProperties(
  listingType: string,
  { city, q }: PropertyOptions = {},
): Promise<PropertyRecord[]> {
  await connection();
  const db = await getDb();

  const filter: Record<string, unknown> = {
    listingType,
    status: "published",
  };

  if (city) filter.city = city;

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { title: rx },
      { location: rx },
      { city: rx },
      { address: rx },
      { propertyType: rx },
    ];
  }

  const docs = await db
    .collection("properties")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return docs.map(serialize);
}

export async function getPublishedProperty(
  id: string,
  listingType: string,
): Promise<PropertyRecord | null> {
  if (!ObjectId.isValid(id)) return null;

  await connection();
  const db = await getDb();
  const doc = await db.collection("properties").findOne({
    _id: new ObjectId(id),
    listingType,
    status: "published",
  });
  if (!doc) return null;

  return serialize(doc);
}
