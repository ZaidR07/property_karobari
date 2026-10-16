import type { Metadata } from "next";
import AdminSection from "../section";

export const metadata: Metadata = {
  title: "Leads | Admin",
};

export default function AdminLeadsPage() {
  return (
    <AdminSection
      title="Leads"
      description="Track and manage sales leads."
    />
  );
}
