import type { Metadata } from "next";
import AdminSection from "../section";

export const metadata: Metadata = {
  title: "Settings | Admin",
};

export default function AdminSettingsPage() {
  return (
    <AdminSection
      title="Settings"
      description="Manage admin account and portal settings."
    />
  );
}
