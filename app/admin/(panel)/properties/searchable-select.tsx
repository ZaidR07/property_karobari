"use client";

import { useEffect, useRef, useState } from "react";

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={open ? query : value}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className={inputClass}
      />

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-500">No matches found</p>
          ) : (
            filtered.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 ${
                  option === value
                    ? "bg-blue-50 font-medium text-blue-600"
                    : "text-zinc-700"
                }`}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
