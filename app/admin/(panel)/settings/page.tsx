import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/app/lib/admin-access";
import AdminSection from "../section";

export const metadata: Metadata = {
  title: "Settings | Admin",
};

export default async function AdminSettingsPage() {
  if (!(await isSuperAdmin())) redirect("/admin/dashboard");
  return (
    <AdminSection
      title="Settings"
      description="Manage admin account and portal settings."
    />
  );
}
