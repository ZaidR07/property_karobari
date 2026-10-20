"use client";

import { useActionState } from "react";
import { deleteProperty } from "@/app/actions/properties";

export default function DeletePropertyButton({
  propertyId,
  title,
}: {
  propertyId: string;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteProperty,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Permanently delete "${title}"? This removes the listing and all its media.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={propertyId} />
      <button
        type="submit"
        disabled={pending}
        title={state?.error ?? "Delete property"}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "…" : "Delete"}
      </button>
    </form>
  );
}
