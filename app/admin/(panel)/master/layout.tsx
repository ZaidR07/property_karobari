import type { Metadata } from "next";
import MasterSubNav from "./master-subnav";

export const metadata: Metadata = {
  title: "Master | Admin",
};

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Master
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Manage master data for the portal.
      </p>
      <MasterSubNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
