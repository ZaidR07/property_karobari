import "server-only";

import { ObjectId } from "mongodb";
import { connection } from "next/server";
import { getDb } from "./mongodb";

export type Employee = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string | null;
  type: string;
  typeLabel: string;
  rank: number;
  managerId: string | null;
  managerName: string | null;
  teamLeaderName: string | null;
  createdAt: string | null;
};

export const EMPLOYEE_TYPES: Record<
  string,
  { label: string; rank: number }
> = {
  manager: { label: "Manager", rank: 2 },
  team_leader: { label: "Team Leader", rank: 3 },
  executive: { label: "Executive", rank: 4 },
};

function serialize(doc: Record<string, unknown> & { _id: ObjectId }): Employee {
  const created = doc.createdAt;
  const type = typeof doc.type === "string" ? doc.type : "executive";
  return {
    _id: doc._id.toString(),
    name: String(doc.name ?? ""),
    phone: String(doc.phone ?? ""),
    email: String(doc.email ?? ""),
    address: typeof doc.address === "string" ? doc.address : null,
    type,
    typeLabel: EMPLOYEE_TYPES[type]?.label ?? type,
    rank: typeof doc.rank === "number" ? doc.rank : 4,
    managerId: doc.managerId ? String(doc.managerId) : null,
    managerName: typeof doc.managerName === "string" ? doc.managerName : null,
    teamLeaderName:
      typeof doc.teamLeaderName === "string" ? doc.teamLeaderName : null,
    createdAt:
      created instanceof Date
        ? created.toISOString()
        : typeof created === "string"
          ? created
          : null,
  };
}

export async function getEmployees(
  options: { managerId?: string | null; excludeId?: string | null } = {},
): Promise<Employee[]> {
  await connection();
  const db = await getDb();

  const filter: Record<string, unknown> = {};
  if (options.managerId && ObjectId.isValid(options.managerId)) {
    filter.managerId = new ObjectId(options.managerId);
  }
  if (options.excludeId && ObjectId.isValid(options.excludeId)) {
    filter._id = { $ne: new ObjectId(options.excludeId) };
  }

  const docs = await db
    .collection("employees")
    .find(filter)
    .sort({ rank: 1, createdAt: -1 })
    .toArray();
  return docs.map(serialize);
}

export async function getEmployeeById(
  id: string,
): Promise<Employee | null> {
  if (!ObjectId.isValid(id)) return null;
  await connection();
  const db = await getDb();
  const doc = await db
    .collection("employees")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serialize(doc) : null;
}
