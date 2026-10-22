import HeroSearch from "./components/hero-search";
import PropertyTypeGrid from "./components/property-type-grid";
import RecentlyListed from "./components/recently-listed";
import Testimonials from "./components/testimonials";
import { getCities } from "./lib/cities";

// Reads MongoDB at request time.
export const instant = false;

export default async function Home() {
  const cities = await getCities();

  return (
    <>
      <section className="relative bg-linear-to-br from-blue-50 via-white to-blue-100/60 text-zinc-900">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.12),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-32 text-center sm:pb-28 sm:pt-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Property Karobari
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-blue-950 sm:text-5xl">
            Find a place you&apos;ll{" "}
            <span className="underline decoration-amber-400 decoration-4 underline-offset-8">
              love
            </span>{" "}
            to live
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 sm:text-lg">
            Buy, rent, or find a PG — explore verified properties across top
            cities.
          </p>

          <HeroSearch cities={cities} />
        </div>
      </section>

      <RecentlyListed />

      <PropertyTypeGrid />

      <Testimonials />
    </>
  );
}
