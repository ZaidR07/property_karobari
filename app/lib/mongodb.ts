import "server-only";

import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Cached across hot reloads in dev and reused as a singleton in production.
export async function getDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env file, e.g. MONGODB_URI=mongodb+srv://...",
    );
  }

  if (!globalThis._mongoClientPromise) {
    globalThis._mongoClientPromise = new MongoClient(uri).connect();
  }

  const client = await globalThis._mongoClientPromise;
  return client.db(process.env.MONGODB_DB || undefined);
}
