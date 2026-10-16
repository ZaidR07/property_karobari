import HeroSearch from "./components/hero-search";
import Testimonials from "./components/testimonials";
import { getCities } from "./lib/cities";

// Reads MongoDB at request time.
export const instant = false;

export default async function Home() {
  const cities = (await getCities()).map((c) => c.city);

  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-br from-blue-950 via-blue-900 to-blue-700 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <span className="inline-block rounded-full border border-white/25 bg-white/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-100">
            Property Kaarobaari
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Find a place you&apos;ll love to live
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 sm:text-lg">
            Buy, rent, or find a PG — explore verified properties across top
            cities.
          </p>

          <HeroSearch cities={cities} />
        </div>
      </section>

      <Testimonials />
    </>
  );
}
