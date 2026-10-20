"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/app/lib/mongodb";
import { deleteFromS3, uploadFilesToS3 } from "@/app/lib/s3";
import { getSession } from "@/app/lib/session";

export type CreatePropertyState =
  | { success?: boolean; error?: string }
  | undefined;

const S3_PREFIX = "properties";

async function saveFiles(files: File[]): Promise<string[]> {
  return uploadFilesToS3(files, S3_PREFIX);
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

  try {
    await db.collection("properties").insertOne({
      ...parsed,
      thumbnail:
        (
          await saveFiles(
            formData
              .getAll("thumbnail")
              .filter((f): f is File => f instanceof File),
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
              formData
                .getAll("brochure")
                .filter((f): f is File => f instanceof File),
            )
          )[0] ?? null
        : null,
      createdBy: session.adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to save property.",
    };
  }

  revalidatePath("/admin/properties");
  return { success: true };
}

export async function deletePropertyMedia(input: {
  propertyId: string;
  field: "thumbnail" | "images" | "videos";
  url: string;
}): Promise<CreatePropertyState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized. Please sign in again." };
  if (!ObjectId.isValid(input.propertyId) || !input.url) {
    return { error: "Invalid request." };
  }

  const db = await getDb();
  const propertyId = new ObjectId(input.propertyId);
  const existing = await db
    .collection("properties")
    .findOne({ _id: propertyId });
  if (!existing) return { error: "Property not found." };

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (input.field === "thumbnail") {
    set.thumbnail = null;
  } else {
    const items = Array.isArray(existing[input.field])
      ? (existing[input.field] as string[])
      : [];
    set[input.field] = items.filter((u) => u !== input.url);
  }

  await db
    .collection("properties")
    .updateOne({ _id: propertyId }, { $set: set });

  try {
    await deleteFromS3(input.url, S3_PREFIX);
  } catch {
    // Old object cleanup is best-effort.
  }

  revalidatePath("/admin/properties");
  return { success: true };
}

export async function replacePropertyMedia(input: {
  propertyId: string;
  field: "thumbnail" | "images" | "videos";
  url: string;
  file: File;
}): Promise<CreatePropertyState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized. Please sign in again." };
  if (!ObjectId.isValid(input.propertyId)) {
    return { error: "Invalid property." };
  }

  const db = await getDb();
  const propertyId = new ObjectId(input.propertyId);
  const existing = await db
    .collection("properties")
    .findOne({ _id: propertyId });
  if (!existing) return { error: "Property not found." };

  let newUrl: string | undefined;
  try {
    [newUrl] = await saveFiles([input.file]);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Upload failed.",
    };
  }
  if (!newUrl) return { error: "Upload failed — please try again." };

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (input.field === "thumbnail") {
    set.thumbnail = newUrl;
  } else if (input.field === "videos") {
    set.videos = [newUrl];
  } else {
    const images = Array.isArray(existing.images) ? existing.images : [];
    set.images = images.map((u: unknown) => (u === input.url ? newUrl : u));
  }

  await db
    .collection("properties")
    .updateOne({ _id: propertyId }, { $set: set });

  try {
    await deleteFromS3(input.url, S3_PREFIX);
  } catch {
    // Old object cleanup is best-effort.
  }

  revalidatePath("/admin/properties");
  return { success: true };
}

export async function deleteProperty(
  _prevState: CreatePropertyState,
  formData: FormData,
): Promise<CreatePropertyState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized. Please sign in again." };

  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) return { error: "Invalid property." };

  const db = await getDb();
  const propertyId = new ObjectId(id);
  const existing = await db
    .collection("properties")
    .findOne({ _id: propertyId });
  if (!existing) return { error: "Property not found." };

  const mediaUrls = [
    existing.thumbnail,
    ...(Array.isArray(existing.images) ? existing.images : []),
    ...(Array.isArray(existing.videos) ? existing.videos : []),
    existing.brochure,
  ].filter((u): u is string => typeof u === "string" && u.length > 0);

  await db.collection("properties").deleteOne({ _id: propertyId });

  // Remove every uploaded object — best-effort, local /uploads paths are skipped.
  await Promise.allSettled(
    mediaUrls.map((url) => deleteFromS3(url, S3_PREFIX)),
  );

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

  try {
    const newThumbnail = (
      await saveFiles(
        input.formData
          .getAll("thumbnail")
          .filter((f): f is File => f instanceof File),
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
        input.formData
          .getAll("brochure")
          .filter((f): f is File => f instanceof File),
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
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update property.",
    };
  }

  revalidatePath("/admin/properties");
  return { success: true };
}
