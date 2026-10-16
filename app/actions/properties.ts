"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/session";

export type CreatePropertyState =
  | { success?: boolean; error?: string }
  | undefined;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function saveFiles(files: File[]): Promise<string[]> {
  const saved: string[] = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${randomUUID()}-${safeName}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(
      path.join(UPLOAD_DIR, fileName),
      Buffer.from(await file.arrayBuffer()),
    );
    saved.push(`/uploads/${fileName}`);
  }

  return saved;
}

function parsePropertyForm(formData: FormData) {
  const str = (key: string) => String(formData.get(key) ?? "").trim();
  const num = (key: string) => {
    const value = str(key);
    return value === "" ? null : Number(value);
  };

  const listingType = str("listingType");
  const isNewLaunch = listingType === "new_launch";
  const parkingAvailable = str("parkingAvailable") === "yes";

  return {
    listingType,
    isNewLaunch,
    status: str("status") === "draft" ? "draft" : "published",
    title: isNewLaunch ? str("projectName") : str("title"),
    price: isNewLaunch ? num("startingFrom") : num("price"),
    propertyType: str("propertyType") || null,
    floor: num("floor"),
    totalFloors: num("totalFloors"),
    bedrooms: str("bedrooms") || null,
    area: num("area"),
    areaUnit: str("areaUnit") || null,
    constructionStatus: str("constructionStatus") || null,
    deposit: num("deposit"),
    address: str("address") || null,
    city: str("city") || null,
    location: str("location") || null,
    furnishing: str("furnishing") || null,
    parking: parkingAvailable
      ? {
          available: true,
          count: num("parkingCount"),
          type: str("parkingType") || null,
        }
      : { available: false, count: null, type: null },
    amenities: formData
      .getAll("amenities")
      .filter((a): a is string => typeof a === "string"),
    availableFor: formData
      .getAll("availableFor")
      .filter((a): a is string => typeof a === "string"),
    pgServices: formData
      .getAll("pgServices")
      .filter((a): a is string => typeof a === "string"),
    sharingOption: str("sharingOption") || null,
    totalCapacity: str("totalCapacity") || null,
    possessionIn: str("possessionIn") || null,
  };
}

function validateProperty(parsed: ReturnType<typeof parsePropertyForm>) {
  if (!["sale", "rent", "pg", "new_launch"].includes(parsed.listingType)) {
    return "Please choose a listing type.";
  }
  // Drafts may be incomplete — only enforce title/price on publish.
  if (parsed.status === "published") {
    if (!parsed.title) {
      return parsed.isNewLaunch
        ? "Project name is required."
        : "Property title is required.";
    }
    if (parsed.price === null || Number.isNaN(parsed.price) || parsed.price < 0) {
      return parsed.isNewLaunch
        ? "Please enter a valid starting price."
        : "Please enter a valid price.";
    }
  }
  return null;
}

export async function createProperty(
  formData: FormData,
): Promise<CreatePropertyState> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized. Please sign in again." };
  }

  const parsed = parsePropertyForm(formData);
  const validationError = validateProperty(parsed);
  if (validationError) return { error: validationError };

  const db = await getDb();

  await db.collection("properties").insertOne({
    ...parsed,
    thumbnail:
      (
        await saveFiles(
          formData.getAll("thumbnail").filter((f): f is File => f instanceof File),
        )
      )[0] ?? null,
    images: await saveFiles(
      formData.getAll("images").filter((f): f is File => f instanceof File),
    ),
    videos: await saveFiles(
      formData.getAll("videos").filter((f): f is File => f instanceof File),
    ),
    brochure: parsed.isNewLaunch
      ? (
          await saveFiles(
            formData.getAll("brochure").filter((f): f is File => f instanceof File),
          )
        )[0] ?? null
      : null,
    createdBy: session.adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/admin/properties");
  return { success: true };
}

export async function updateProperty(input: {
  propertyId: string;
  formData: FormData;
}): Promise<CreatePropertyState> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized. Please sign in again." };
  }
  if (!ObjectId.isValid(input.propertyId)) {
    return { error: "Invalid property." };
  }

  const parsed = parsePropertyForm(input.formData);
  const validationError = validateProperty(parsed);
  if (validationError) return { error: validationError };

  const db = await getDb();
  const propertyId = new ObjectId(input.propertyId);
  const existing = await db
    .collection("properties")
    .findOne({ _id: propertyId });
  if (!existing) {
    return { error: "Property not found." };
  }

  const newThumbnail = (
    await saveFiles(
      input.formData.getAll("thumbnail").filter((f): f is File => f instanceof File),
    )
  )[0];
  const newImages = await saveFiles(
    input.formData.getAll("images").filter((f): f is File => f instanceof File),
  );
  const newVideos = await saveFiles(
    input.formData.getAll("videos").filter((f): f is File => f instanceof File),
  );
  const newBrochure = (
    await saveFiles(
      input.formData.getAll("brochure").filter((f): f is File => f instanceof File),
    )
  )[0];

  await db.collection("properties").updateOne(
    { _id: propertyId },
    {
      $set: {
        ...parsed,
        thumbnail: newThumbnail ?? (existing.thumbnail ?? null),
        images: newImages.length > 0 ? newImages : (existing.images ?? []),
        videos: newVideos.length > 0 ? newVideos : (existing.videos ?? []),
        brochure: parsed.isNewLaunch
          ? (newBrochure ?? (existing.brochure ?? null))
          : null,
        status: parsed.status,
        updatedAt: new Date(),
      },
    },
  );

  revalidatePath("/admin/properties");
  return { success: true };
}
