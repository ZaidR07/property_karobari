import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
};

const stats = [
  { label: "Total Properties", value: "—" },
  { label: "Published Blogs", value: "—" },
  { label: "New Enquiries", value: "—" },
  { label: "Active Leads", value: "—" },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Overview of Property Kaarobaari.
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
