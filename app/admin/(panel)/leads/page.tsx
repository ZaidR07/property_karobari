import type { Metadata } from "next";
import { getAllLeads } from "@/app/lib/leads";
import LeadManager from "./lead-manager";

export const metadata: Metadata = {
  title: "Leads | Admin",
};

// Reads MongoDB at request time.
export const instant = false;

export default async function AdminLeadsPage() {
  const leads = await getAllLeads();
  return <LeadManager leads={leads} />;
}
