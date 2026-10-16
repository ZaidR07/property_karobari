"use client";

import { useState, useTransition } from "react";
import { createCity, updateCity } from "@/app/actions/master";

const inputClass =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

type CityModalProps = {
  mode: "create" | "edit";
  cityId?: string;
  initialCity?: string;
  initialLocations?: string[];
};

export default function CityModal({
  mode,
  cityId,
  initialCity = "",
  initialLocations,
}: CityModalProps) {
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState(initialCity);
  const [locations, setLocations] = useState<string[]>(
    initialLocations && initialLocations.length > 0 ? initialLocations : [""],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateCity({ cityId: cityId ?? "", city, locations })
        : await createCity({ city, locations });

      if (result?.success) {
        if (!isEdit) {
          setCity("");
          setLocations([""]);
        }
        setOpen(false);
      } else {
        setError(result?.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Edit
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Create
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-100 overflow-y-auto bg-black/50 p-4 text-left">
          <div className="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                {isEdit ? "Edit City & Locations" : "Add City & Locations"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
                aria-label="Close"
              >
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
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label
                  htmlFor={isEdit ? `city-${cityId}` : "city"}
                  className="block text-sm font-medium text-zinc-700"
                >
                  City name
                </label>
                <input
                  id={isEdit ? `city-${cityId}` : "city"}
                  type="text"
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="e.g. Pune"
                  className={`mt-1 ${inputClass}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Locations
                </label>
                <div className="mt-1 space-y-2">
                  {locations.map((value, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(event) =>
                          setLocations((rows) =>
                            rows.map((row, i) =>
                              i === index ? event.target.value : row,
                            ),
                          )
                        }
                        placeholder={`Location ${index + 1}`}
                        className={inputClass}
                      />
                      {locations.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setLocations((rows) =>
                              rows.filter((_, i) => i !== index),
                            )
                          }
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-100"
                          aria-label={`Remove location ${index + 1}`}
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
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLocations((rows) => [...rows, ""])}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  + Add location
                </button>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {pending ? "Saving…" : isEdit ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
