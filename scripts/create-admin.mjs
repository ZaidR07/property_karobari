// Creates or updates an admin user in MongoDB.
// Usage:
//   node --env-file=.env scripts/create-admin.mjs <email> <password> [name]

import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const [email, password, name = "Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    "Usage: node --env-file=.env scripts/create-admin.mjs <email> <password> [name]",
  );
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || undefined);
  const hash = await bcrypt.hash(password, 10);
  const normalizedEmail = email.trim().toLowerCase();

  await db.collection("admins").updateOne(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        name,
        password: hash,
        role: "admin",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  // Auto-remove expired sessions and password reset codes.
  await db
    .collection("sessions")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("password_resets")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  console.log(`Admin "${normalizedEmail}" created/updated successfully.`);
} finally {
  await client.close();
}
