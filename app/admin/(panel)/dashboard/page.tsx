import type { Metadata } from "next";
import { getOpenEnquiriesCount } from "@/app/lib/enquiries";
import { getActiveLeadsCount } from "@/app/lib/leads";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
};

// Reads MongoDB at request time.
export const instant = false;

export default async function AdminDashboardPage() {
  const [openEnquiries, activeLeads] = await Promise.all([
    getOpenEnquiriesCount(),
    getActiveLeadsCount(),
  ]);

  const stats = [
    { label: "Total Properties", value: "—" },
    { label: "Published Blogs", value: "—" },
    { label: "Open Enquiries", value: String(openEnquiries) },
    { label: "Active Leads", value: String(activeLeads) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Overview of Property Karobari.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-zinc-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
