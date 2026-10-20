import Link from "next/link";
import { getPropertyTypeStats } from "@/app/lib/properties";
import { listingTypeToPath } from "@/app/lib/property-format";

const CATEGORIES = [
  { type: "Flats", bg: "bg-[#cdeae8]", img: "/apartment.png" },
  { type: "Builder Floors", bg: "bg-[#d9f0d3]", img: "/builderfloor.png" },
  { type: "Row House", bg: "bg-[#fdeec9]", img: "/rowhouse.png" },
  { type: "Villa", bg: "bg-[#fbe0dc]", img: "/villa.png" },
  { type: "Shop", bg: "bg-[#e6e0f8]", img: "/shop.png" },
  { type: "Office Space", bg: "bg-[#d7f0f5]", img: "/office.png" },
];

export default async function PropertyTypeGrid() {
  const stats = new Map(
    (await getPropertyTypeStats()).map((s) => [s.propertyType, s]),
  );

  return (
    <section className="bg-white py-14">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          <span className="mr-2 inline-block h-6 w-1.5 rounded-full bg-amber-400 align-middle" />
          Browse by Property Type
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Find the space that fits your need.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const stat = stats.get(cat.type);
            const count = stat?.count ?? 0;
            const href = `/properties/${listingTypeToPath(
              stat?.listingType ?? "sale",
            )}?q=${encodeURIComponent(cat.type)}`;

            return (
              <Link
                key={cat.type}
                href={href}
                className={`group relative block h-60 overflow-hidden rounded-2xl ${cat.bg} shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.type}
                  className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 bg-linear-to-b from-white/85 via-white/40 to-transparent"
                  aria-hidden="true"
                />
                <div className="relative px-6 pt-6">
                  <h3 className="text-xl font-bold text-slate-800">
                    {cat.type}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {count === 0 ? "New listings soon" : `${count}+ Properties`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
