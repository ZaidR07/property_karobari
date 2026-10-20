import { redirect } from "next/navigation";
import { EMPLOYEE_TYPES } from "@/app/lib/employees";
import { getDb } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/session";
import AdminSidebar from "./sidebar";

// Every page in this group reads the session cookie + database per request.
export const instant = false;

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/admin");
  }

  const db = await getDb();
  const admin = await db
    .collection("admins")
    .findOne({ email: session.email });

  const role = typeof admin?.role === "string" ? admin.role : null;
  const designation = role
    ? (EMPLOYEE_TYPES[role]?.label ?? role)
    : "Administrator";
  // Accounts created before ranks existed count as super admin.
  const rank = typeof admin?.rank === "number" ? admin.rank : 1;
  const displayName =
    typeof admin?.name === "string" && admin.name ? admin.name : session.email;
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AdminSidebar rank={rank} />
      <main className="flex-1 bg-zinc-50 p-4 sm:p-6 lg:p-8">
        <div className="sticky top-3 z-30 -mr-2 -mt-2 mb-6 flex justify-end sm:-mr-4 sm:-mt-4 lg:-mr-6 lg:-mt-6">
          <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white py-1.5 pl-1.5 pr-5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {initials || "A"}
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight text-zinc-900">
                {session.email}
              </p>
              <p className="text-xs leading-tight text-zinc-500">
                {designation}
              </p>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
