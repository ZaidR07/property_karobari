"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/session";

export type CityActionState =
  | { success?: boolean; error?: string }
  | undefined;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanLocations(locations: string[]) {
  return [...new Set(locations.map((l) => (l ?? "").trim()).filter(Boolean))];
}

export async function createCity(input: {
  city: string;
  locations: string[];
}): Promise<CityActionState> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized. Please sign in again." };
  }

  const city = (input.city ?? "").trim();
  if (!city) {
    return { error: "City name is required." };
  }

  const locations = cleanLocations(input.locations ?? []);

  const db = await getDb();

  const existing = await db
    .collection("cities")
    .findOne({ city: { $regex: `^${escapeRegex(city)}$`, $options: "i" } });
  if (existing) {
    return { error: "This city already exists." };
  }

  await db.collection("cities").insertOne({
    city,
    locations,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/admin/master");
  return { success: true };
}

export async function updateCity(input: {
  cityId: string;
  city: string;
  locations: string[];
}): Promise<CityActionState> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized. Please sign in again." };
  }

  if (!ObjectId.isValid(input.cityId)) {
    return { error: "Invalid city." };
  }

  const city = (input.city ?? "").trim();
  if (!city) {
    return { error: "City name is required." };
  }

  const locations = cleanLocations(input.locations ?? []);

  const db = await getDb();
  const cityId = new ObjectId(input.cityId);

  const existing = await db.collection("cities").findOne({
    city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
    _id: { $ne: cityId },
  });
  if (existing) {
    return { error: "This city already exists." };
  }

  await db
    .collection("cities")
    .updateOne(
      { _id: cityId },
      { $set: { city, locations, updatedAt: new Date() } },
    );

  revalidatePath("/admin/master");
  return { success: true };
}
