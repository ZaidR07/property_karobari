type Testimonial = {
  content: string;
  author: string;
  position: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    content:
      "Property Kaarobaari helped me find a 2BHK in my budget within two weeks. The listings were genuine and the team arranged site visits quickly. Smoothest home-buying experience I've had.",
    author: "Priya Sharma",
    position: "Home Buyer, Mumbai",
    rating: 5,
  },
  {
    content:
      "I was relocating for work and needed a rental flat fast. Their verified listings saved me from broker runarounds — I signed my lease in three days.",
    author: "Rahul Verma",
    position: "Tenant, Pune",
    rating: 5,
  },
  {
    content:
      "As a first-time PG seeker, I had no idea where to start. The filters made it easy to find a safe, well-maintained PG close to my office.",
    author: "Sneha Patel",
    position: "Working Professional, Bangalore",
    rating: 4,
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${
            i < rating ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"
          }`}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-linear-to-b from-white to-blue-50/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="rounded-full border border-blue-200 bg-linear-to-r from-blue-100 to-blue-50 px-5 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-600">
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
            What Our Clients Say
          </h2>
          <p className="mt-3 text-zinc-600">
            Hear from buyers, tenants, and professionals who found their space
            with Property Kaarobaari.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.author}
              className="relative flex flex-col rounded-2xl border border-blue-100/60 bg-white p-6 pt-8 shadow-lg"
            >
              <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M10 8c-3.3 0-6 2.7-6 6v2h5v-5H6.5C6.8 9.9 8.2 9 10 9V8zm10 0c-3.3 0-6 2.7-6 6v2h5v-5h-2.5c.3-1.1 1.7-2 3.5-2V8z" />
                </svg>
              </span>

              <Stars rating={t.rating} />

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zinc-600">
                “{t.content}”
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {t.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {t.author}
                  </p>
                  <p className="text-xs text-zinc-500">{t.position}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
