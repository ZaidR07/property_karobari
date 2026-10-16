import "server-only";

import { connection } from "next/server";
import { getDb } from "./mongodb";

export type City = {
  _id: string;
  city: string;
  locations: string[];
};

export async function getCities(): Promise<City[]> {
  await connection();
  const db = await getDb();
  const docs = await db
    .collection("cities")
    .find({})
    .sort({ city: 1 })
    .limit(200)
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toString(),
    city: String(doc.city ?? ""),
    locations: Array.isArray(doc.locations)
      ? doc.locations.map(String)
      : [],
  }));
}
