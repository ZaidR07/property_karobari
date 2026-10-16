import "server-only";

import { ObjectId } from "mongodb";
import { connection } from "next/server";
import { getDb } from "./mongodb";
import type { Blog } from "./blog-utils";

function serialize(doc: Record<string, unknown> & { _id: ObjectId }): Blog {
  const posting = doc.postingDateTime;
  const created = doc.createdAt;
  return {
    _id: doc._id.toString(),
    title: String(doc.title ?? ""),
    content: String(doc.content ?? ""),
    thumbnailUrl:
      typeof doc.thumbnailUrl === "string" ? doc.thumbnailUrl : null,
    bannerUrl: typeof doc.bannerUrl === "string" ? doc.bannerUrl : null,
    slug: String(doc.slug ?? ""),
    postingDateTime:
      posting instanceof Date
        ? posting.toISOString()
        : typeof posting === "string"
          ? posting
          : null,
    createdAt:
      created instanceof Date
        ? created.toISOString()
        : typeof created === "string"
          ? created
          : null,
  };
}

export async function getAllBlogs(): Promise<Blog[]> {
  await connection();
  const db = await getDb();
  const docs = await db
    .collection("blogs")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(serialize);
}

export async function getPublishedBlogs(): Promise<Blog[]> {
  await connection();
  const db = await getDb();
  const now = new Date();
  const docs = await db
    .collection("blogs")
    .find({
      $or: [
        { postingDateTime: null },
        { postingDateTime: { $exists: false } },
        { postingDateTime: { $lte: now } },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(serialize);
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  await connection();
  const db = await getDb();
  const doc = await db.collection("blogs").findOne({ slug });
  if (!doc) return null;
  return serialize(doc);
}
