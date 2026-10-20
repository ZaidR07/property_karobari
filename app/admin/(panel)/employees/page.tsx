import type { Metadata } from "next";
import { getEmployeeById, getEmployees } from "@/app/lib/employees";
import { getDb } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/session";
import EmployeeManager from "./employee-manager";

export const metadata: Metadata = {
  title: "Employees | Admin",
};

// Reads MongoDB at request time.
export const instant = false;

export default async function AdminEmployeesPage() {
  const session = await getSession();
  const db = await getDb();
  const admin = session
    ? await db.collection("admins").findOne({ email: session.email })
    : null;

  // Accounts created before ranks existed count as super admin (rank 1).
  const rank = typeof admin?.rank === "number" ? admin.rank : 1;
  const isSuperAdmin = rank === 1;
  const selfEmployeeId = admin?.employeeId ? String(admin.employeeId) : null;

  // Super admin sees everyone; managers only see employees assigned to them.
  // The signed-in employee never appears in their own list either way.
  const employees = await getEmployees({
    managerId: isSuperAdmin ? undefined : selfEmployeeId,
    excludeId: selfEmployeeId,
  });

  // "Assign to Manager" options: super admin picks any manager,
  // a manager can only assign to themselves.
  const managers = isSuperAdmin
    ? employees.filter((e) => e.type === "manager")
    : selfEmployeeId
      ? [await getEmployeeById(selfEmployeeId)].filter(
          (e): e is NonNullable<typeof e> => e !== null && e.type === "manager",
        )
      : [];

  return (
    <EmployeeManager
      employees={employees}
      managers={managers}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
