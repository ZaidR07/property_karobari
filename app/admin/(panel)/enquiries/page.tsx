import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/app/lib/admin-access";
import { getAllEnquiries } from "@/app/lib/enquiries";
import EnquiryManager from "./enquiry-manager";

export const metadata: Metadata = {
  title: "Enquiries | Admin",
};

// Reads MongoDB at request time.
export const instant = false;

export default async function AdminEnquiriesPage() {
  if (!(await isSuperAdmin())) redirect("/admin/dashboard");
  const enquiries = await getAllEnquiries();
  return <EnquiryManager enquiries={enquiries} />;
}
