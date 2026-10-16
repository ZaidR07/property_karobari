"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const subTabs = [{ href: "/admin/master", label: "City & Location" }];

export default function MasterSubNav() {
  const pathname = usePathname();

  return (
    <div className="mt-4 flex gap-1 border-b border-zinc-200">
      {subTabs.map((tab) => {
        const active =
          tab.href === "/admin/master"
            ? pathname === "/admin/master"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
