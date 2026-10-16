"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const propertyLinks = [
  { href: "/properties/buy", label: "Buy" },
  { href: "/properties/rent", label: "Rent" },
  { href: "/properties/pg", label: "PG" },
];

const navLinks = [
  { href: "/properties/new-launch", label: "New Launch" },
  { href: "/about", label: "About" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function linkClass(active: boolean) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? "text-blue-600"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  }`;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
  const [desktopPropertiesOpen, setDesktopPropertiesOpen] = useState(false);
  const propertiesActive = isActive(pathname, "/properties");

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Property <span className="text-blue-600">Kaarobaari</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <div
            className="relative"
            onMouseEnter={() => setDesktopPropertiesOpen(true)}
            onMouseLeave={() => setDesktopPropertiesOpen(false)}
          >
            <button
              type="button"
              className={`${linkClass(propertiesActive)} flex items-center gap-1`}
              aria-haspopup="true"
              aria-expanded={desktopPropertiesOpen}
              onClick={() => setDesktopPropertiesOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setDesktopPropertiesOpen(false);
              }}
            >
              Properties
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  desktopPropertiesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {desktopPropertiesOpen && (
              <div className="absolute left-0 top-full z-50 pt-2">
                <div className="w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                  {propertyLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDesktopPropertiesOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium transition-colors ${
                        isActive(pathname, link.href)
                          ? "bg-blue-50 text-blue-600"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(isActive(pathname, link.href))}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            <button
              type="button"
              className={`${linkClass(propertiesActive)} flex w-full items-center justify-between`}
              aria-expanded={mobilePropertiesOpen}
              onClick={() => setMobilePropertiesOpen((open) => !open)}
            >
              Properties
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  mobilePropertiesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mobilePropertiesOpen && (
              <div className="space-y-1 pb-1 pl-4">
                {propertyLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block ${linkClass(
                      isActive(pathname, link.href),
                    )}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block ${linkClass(isActive(pathname, link.href))}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
