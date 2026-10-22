import "server-only";

import { randomBytes } from "crypto";
import path from "path";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

export function getS3() {
  const { AWS_REGION, AWS_S3_BUCKET } = process.env;
  if (!AWS_REGION || !AWS_S3_BUCKET) {
    throw new Error(
      "AWS_REGION and AWS_S3_BUCKET must be set in .env for file uploads.",
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

export async function uploadFileToS3(file: File, prefix: string) {
  const { client, bucket, publicBaseUrl } = getS3();
  let body: Buffer = Buffer.from(await file.arrayBuffer());
  let contentType = file.type || "application/octet-stream";
  let ext =
    path.extname(file.name).replace(".", "").toLowerCase() || "bin";

  // Compress raster images: auto-orient, cap at 1920px wide, convert to WebP.
  if (
    contentType.startsWith("image/") &&
    contentType !== "image/svg+xml" &&
    contentType !== "image/gif"
  ) {
    body = await sharp(body)
      .rotate()
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    contentType = "image/webp";
    ext = "webp";
  }

  const key = `${prefix}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${publicBaseUrl}/${key}`;
}

export async function uploadFilesToS3(files: File[], prefix: string) {
  const urls: string[] = [];
  for (const file of files) {
    if (file.size === 0) continue;
    urls.push(await uploadFileToS3(file, prefix));
  }
  return urls;
}

export async function deleteFromS3(url: string | null, prefix: string) {
  if (!url || url.startsWith("/")) return; // Local files aren't in S3.
  const { client, bucket, publicBaseUrl } = getS3();
  const key = url.startsWith(`${publicBaseUrl}/`)
    ? url.slice(publicBaseUrl.length + 1)
    : new URL(url).pathname.slice(1);
  if (!key.startsWith(`${prefix}/`)) return;

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // Object may already be gone — deletion should still proceed.
  }
}
