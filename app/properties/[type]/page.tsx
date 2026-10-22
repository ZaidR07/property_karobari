import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageBanner from "@/app/components/page-banner";
import PropertyCard from "@/app/components/property-card";
import { getCities } from "@/app/lib/cities";
import { getPublishedProperties } from "@/app/lib/properties";
import { PROPERTY_PAGES } from "@/app/lib/property-format";

// Reads MongoDB at request time.
export const instant = false;

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{
    city?: string;
    q?: string;
    ptype?: string;
    min?: string;
    max?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const config = PROPERTY_PAGES[type];
  if (!config) return { title: "Not found | Property Karobari" };

  return {
    title: `${config.heading} | Property Karobari`,
    description: config.tagline,
  };
}

export default async function PropertiesPage({ params, searchParams }: Props) {
  const { type } = await params;
  const config = PROPERTY_PAGES[type];
  if (!config) notFound();

  const { city = "", q = "", ptype = "", min = "", max = "" } =
    await searchParams;
  const minPrice = Number(min);
  const maxPrice = Number(max);
  const [properties, cities] = await Promise.all([
    getPublishedProperties(config.listingType, {
      city,
      q,
      ptype,
      min: Number.isFinite(minPrice) && min !== "" ? minPrice : undefined,
      max: Number.isFinite(maxPrice) && max !== "" ? maxPrice : undefined,
    }),
    getCities(),
  ]);
  const cityLabel = cities.find((c) => c.city === city)?.city ?? city;

  return (
    <section className="min-h-screen bg-linear-to-br from-white via-blue-50/30 to-blue-100/20 pb-16">
      <PageBanner
        title={config.heading}
        subtitle={config.tagline}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Properties" },
          { label: config.label },
        ]}
      />

      <div className="container mx-auto px-6 pt-10">
        <p className="mb-6 text-sm font-medium text-zinc-600">
          {properties.length} {properties.length === 1 ? "property" : "properties"}
          {ptype ? ` · ${ptype}` : ""}
          {cityLabel ? ` in ${cityLabel}` : ""}
          {q ? ` matching “${q}”` : ""}
        </p>

          {properties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 py-20 text-center text-zinc-500">
              No properties found. Try a different city or search term.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
      </div>
    </section>
  );
}
