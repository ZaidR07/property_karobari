import "server-only";

import { getDb } from "./mongodb";
import { getSession } from "./session";

// Original super-admin accounts predate ranks — they count as rank 1.
export const SUPER_ADMIN_RANK = 1;

export async function getAdminRank(): Promise<number | null> {
  const session = await getSession();
  if (!session) return null;

  const db = await getDb();
  const admin = await db
    .collection("admins")
    .findOne({ email: session.email });

  return typeof admin?.rank === "number" ? admin.rank : SUPER_ADMIN_RANK;
}

export async function isSuperAdmin(): Promise<boolean> {
  return (await getAdminRank()) === SUPER_ADMIN_RANK;
}
