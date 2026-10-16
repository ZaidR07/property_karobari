import type { Metadata } from "next";
import AdminSection from "../section";

export const metadata: Metadata = {
  title: "Enquiries | Admin",
};

export default function AdminEnquiriesPage() {
  return (
    <AdminSection
      title="Enquiries"
      description="View and respond to contact enquiries."
    />
  );
}
