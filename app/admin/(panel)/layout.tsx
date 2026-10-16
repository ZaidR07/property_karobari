import { redirect } from "next/navigation";
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

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AdminSidebar email={session.email} />
      <main className="flex-1 bg-zinc-50 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
