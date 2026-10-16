"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const tabs = [
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "pg", label: "PG" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

export default function HeroSearch({ cities }: { cities: string[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("buy");
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");

  const search = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.push(`/properties/${tab}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl rounded-2xl bg-white p-4 text-left shadow-xl sm:p-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <label key={t.value} className="chip">
            {t.label}
            <input
              type="radio"
              name="listingType"
              value={t.value}
              checked={tab === t.value}
              onChange={() => setTab(t.value)}
              className="sr-only"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={inputClass}
          aria-label="City"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          placeholder="Search locality or project"
          className={inputClass}
          aria-label="Search"
        />

        <button
          type="button"
          onClick={search}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Search
        </button>
      </div>
    </div>
  );
}
