import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/app/components/page-banner";
import { getPublishedProperty } from "@/app/lib/properties";
import {
  formatPrice,
  listingLabel,
  PROPERTY_PAGES,
} from "@/app/lib/property-format";

// Reads MongoDB at request time.
export const instant = false;

type Props = { params: Promise<{ type: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, id } = await params;
  const config = PROPERTY_PAGES[type];
  if (!config) return { title: "Not found | Property Kaarobaari" };

  const property = await getPublishedProperty(id, config.listingType);
  if (!property) return { title: "Not found | Property Kaarobaari" };

  return {
    title: `${property.title || "Property"} | Property Kaarobaari`,
    description:
      property.location || property.city
        ? [property.location, property.city].filter(Boolean).join(", ")
        : config.heading,
  };
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: Props) {
  const { type, id } = await params;
  const config = PROPERTY_PAGES[type];
  if (!config) notFound();

  const property = await getPublishedProperty(id, config.listingType);
  if (!property) notFound();

  const isRentLike =
    property.listingType === "rent" || property.listingType === "pg";
  const isNewLaunch = property.listingType === "new_launch";
  const priceLabel = isNewLaunch
    ? "Starting From"
    : isRentLike
      ? "Rent"
      : "Price";
  const hero = property.thumbnail || property.images[0] || null;

  return (
    <section className="min-h-screen bg-linear-to-br from-white via-blue-50/30 to-blue-100/20 pb-16">
      <PageBanner
        title={property.title || "Untitled property"}
        subtitle={
          [property.location, property.city].filter(Boolean).join(", ") ||
          undefined
        }
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Properties" },
          { label: config.label, href: `/properties/${type}` },
          { label: property.title || "Property" },
        ]}
      />

      <div className="container mx-auto px-6 pt-10">
        <article className="overflow-hidden rounded-2xl border border-blue-100/50 bg-white shadow-lg">
          {hero && (
            <div className="w-full bg-blue-50">
              <div className="aspect-video w-full md:aspect-16/7 lg:aspect-16/6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero}
                  alt={property.title || "Property"}
                  className="block h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="inline-block rounded-full border border-blue-200 bg-linear-to-r from-blue-100 to-blue-50 px-4 py-1 text-xs font-bold text-blue-600">
                {listingLabel(property.listingType)}
              </span>
              <p className="text-2xl font-bold text-blue-600">
                {formatPrice(property.price) ?? "Price on request"}
                {property.price !== null && isRentLike && (
                  <span className="text-sm font-medium text-zinc-500">
                    /month
                  </span>
                )}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
              <Detail label="Property type" value={property.propertyType} />
              <Detail label="Bedrooms" value={property.bedrooms} />
              <Detail
                label="Area"
                value={
                  property.area !== null
                    ? `${property.area} ${property.areaUnit ?? ""}`.trim()
                    : null
                }
              />
              {!isNewLaunch && property.listingType !== "pg" && (
                <Detail
                  label="Construction status"
                  value={property.constructionStatus}
                />
              )}
              <Detail
                label="Floor"
                value={
                  property.floor !== null
                    ? `Floor ${property.floor}${
                        property.totalFloors !== null
                          ? ` of ${property.totalFloors}`
                          : ""
                      }`
                    : null
                }
              />
              <Detail label="Furnishing" value={property.furnishing} />
              <Detail
                label="Parking"
                value={
                  property.parking.available
                    ? [property.parking.count, property.parking.type]
                        .filter(Boolean)
                        .join(" · ") || "Yes"
                    : "No"
                }
              />
              {isRentLike && (
                <Detail
                  label="Deposit"
                  value={
                    property.deposit !== null
                      ? formatPrice(property.deposit)
                      : null
                  }
                />
              )}
              {property.listingType === "rent" &&
                property.availableFor.length > 0 && (
                  <Detail
                    label="Available for"
                    value={property.availableFor.join(", ")}
                  />
                )}
              {property.listingType === "pg" && (
                <>
                  <Detail
                    label="Sharing option"
                    value={property.sharingOption}
                  />
                  <Detail
                    label="Total capacity"
                    value={property.totalCapacity}
                  />
                  {property.pgServices.length > 0 && (
                    <Detail
                      label="PG Services"
                      value={property.pgServices.join(", ")}
                    />
                  )}
                </>
              )}
              {isNewLaunch && (
                <Detail label="Possession In" value={property.possessionIn} />
              )}
            </div>

            {property.amenities.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Amenities
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.images.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Property Images
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.images.map((image) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={image}
                      src={image}
                      alt="Property image"
                      className="h-32 w-full rounded-lg object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-blue-100 to-blue-50 p-6">
              <div>
                <p className="text-lg font-bold text-blue-900">
                  Interested in this property?
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Get in touch with our team for a site visit or more details.
                </p>
              </div>
              <Link
                href="/contact"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
