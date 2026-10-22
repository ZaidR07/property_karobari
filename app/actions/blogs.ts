"use server";

import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { revalidatePath, updateTag } from "next/cache";
import { normalizeQuillHtml, slugify } from "@/app/lib/blog-utils";
import { getDb } from "@/app/lib/mongodb";
import { deleteFromS3, uploadFileToS3 } from "@/app/lib/s3";
import { getSession } from "@/app/lib/session";

export type BlogFormState = { error?: string; success?: boolean } | undefined;

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024; // 5 MB
const S3_PREFIX = "blogs";

function revalidate() {
  updateTag("blogs");
  revalidatePath("/admin/blogs");
  revalidatePath("/blogs");
}

function getImage(formData: FormData, field: string): File | null {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_THUMBNAIL_BYTES)
    throw new Error("Images must be under 5 MB.");
  return file;
}

function getPostingDateTime(formData: FormData): Date | null {
  const raw = String(formData.get("postingDateTime") ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function uniqueSlug(title: string, excludeId?: ObjectId) {
  const db = await getDb();
  const base = slugify(title);
  const clash = await db.collection("blogs").findOne({
    slug: base,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  return clash ? `${base}-${randomBytes(2).toString("hex")}` : base;
}

export async function createBlog(
  _prevState: BlogFormState,
  formData: FormData,
): Promise<BlogFormState> {
  if (!(await getSession())) return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const content = normalizeQuillHtml(String(formData.get("content") ?? ""));

  if (!title || !content) {
    return { error: "Title and content are required." };
  }

  try {
    const thumbnail = getImage(formData, "thumbnail");
    const banner = getImage(formData, "banner");
    const db = await getDb();

    await db.collection("blogs").insertOne({
      title,
      content,
      thumbnailUrl: thumbnail
        ? await uploadFileToS3(thumbnail, S3_PREFIX)
        : null,
      bannerUrl: banner ? await uploadFileToS3(banner, S3_PREFIX) : null,
      slug: await uniqueSlug(title),
      postingDateTime: getPostingDateTime(formData),
      createdAt: new Date(),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to post blog." };
  }

  revalidate();
  return { success: true };
}

export async function updateBlog(
  _prevState: BlogFormState,
  formData: FormData,
): Promise<BlogFormState> {
  if (!(await getSession())) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = normalizeQuillHtml(String(formData.get("content") ?? ""));

  if (!ObjectId.isValid(id)) return { error: "Invalid blog id." };
  if (!title || !content) {
    return { error: "Title and content are required." };
  }

  try {
    const db = await getDb();
    const _id = new ObjectId(id);
    const existing = await db.collection("blogs").findOne({ _id });
    if (!existing) return { error: "Blog not found." };

    const update: Record<string, unknown> = {
      title,
      content,
      slug: await uniqueSlug(title, _id),
      postingDateTime: getPostingDateTime(formData),
      updatedAt: new Date(),
    };

    const thumbnail = getImage(formData, "thumbnail");
    if (thumbnail) {
      update.thumbnailUrl = await uploadFileToS3(thumbnail, S3_PREFIX);
      await deleteFromS3(
        typeof existing.thumbnailUrl === "string" ? existing.thumbnailUrl : null,
        S3_PREFIX,
      );
    }

    const banner = getImage(formData, "banner");
    if (banner) {
      update.bannerUrl = await uploadFileToS3(banner, S3_PREFIX);
      await deleteFromS3(
        typeof existing.bannerUrl === "string" ? existing.bannerUrl : null,
        S3_PREFIX,
      );
    }

    await db.collection("blogs").updateOne({ _id }, { $set: update });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update blog." };
  }

  revalidate();
  return { success: true };
}

export async function deleteBlog(
  _prevState: BlogFormState,
  formData: FormData,
): Promise<BlogFormState> {
  if (!(await getSession())) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) return { error: "Invalid blog id." };

  try {
    const db = await getDb();
    const _id = new ObjectId(id);
    const existing = await db.collection("blogs").findOne({ _id });
    if (!existing) return { error: "Blog not found." };

    await deleteFromS3(
      typeof existing.thumbnailUrl === "string" ? existing.thumbnailUrl : null,
      S3_PREFIX,
    );
    await deleteFromS3(
      typeof existing.bannerUrl === "string" ? existing.bannerUrl : null,
      S3_PREFIX,
    );
    await db.collection("blogs").deleteOne({ _id });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete blog." };
  }

  revalidate();
  return { success: true };
}
