"use server";

import { randomBytes } from "crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import path from "path";
import { normalizeQuillHtml, slugify } from "@/app/lib/blog-utils";
import { getDb } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/session";

export type BlogFormState = { error?: string; success?: boolean } | undefined;

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024; // 5 MB
const S3_PREFIX = "blogs";

const IMAGE_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function revalidate() {
  revalidatePath("/admin/blogs");
  revalidatePath("/blogs");
}

function s3() {
  const { AWS_REGION, AWS_S3_BUCKET } = process.env;
  if (!AWS_REGION || !AWS_S3_BUCKET) {
    throw new Error(
      "AWS_REGION and AWS_S3_BUCKET must be set in .env for image uploads.",
    );
  }
  return {
    client: new S3Client({ region: AWS_REGION }),
    bucket: AWS_S3_BUCKET,
    publicBaseUrl:
      process.env.AWS_S3_PUBLIC_BASE_URL ??
      `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`,
  };
}

async function saveImage(file: File): Promise<string> {
  const { client, bucket, publicBaseUrl } = s3();
  const ext =
    IMAGE_EXT_BY_MIME[file.type] ??
    (path.extname(file.name).replace(".", "").toLowerCase() || "jpg");
  const key = `${S3_PREFIX}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || "application/octet-stream",
    }),
  );

  return `${publicBaseUrl}/${key}`;
}

async function removeImage(imageUrl: string | null) {
  if (!imageUrl) return;
  const { client, bucket, publicBaseUrl } = s3();
  const key = imageUrl.startsWith(`${publicBaseUrl}/`)
    ? imageUrl.slice(publicBaseUrl.length + 1)
    : new URL(imageUrl).pathname.slice(1);
  if (!key.startsWith(`${S3_PREFIX}/`)) return;

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // Object may already be gone — deletion should still proceed.
  }
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
      thumbnailUrl: thumbnail ? await saveImage(thumbnail) : null,
      bannerUrl: banner ? await saveImage(banner) : null,
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
      update.thumbnailUrl = await saveImage(thumbnail);
      await removeImage(
        typeof existing.thumbnailUrl === "string" ? existing.thumbnailUrl : null,
      );
    }

    const banner = getImage(formData, "banner");
    if (banner) {
      update.bannerUrl = await saveImage(banner);
      await removeImage(
        typeof existing.bannerUrl === "string" ? existing.bannerUrl : null,
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

    await removeImage(
      typeof existing.thumbnailUrl === "string" ? existing.thumbnailUrl : null,
    );
    await removeImage(
      typeof existing.bannerUrl === "string" ? existing.bannerUrl : null,
    );
    await db.collection("blogs").deleteOne({ _id });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete blog." };
  }

  revalidate();
  return { success: true };
}
