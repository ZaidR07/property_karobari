export default function AdminSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
      <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        {title} management coming soon.
      </div>
    </div>
  );
}
