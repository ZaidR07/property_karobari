"use client";

import { useRef, useState, useTransition } from "react";
import {
  createProperty,
  deletePropertyMedia,
  replacePropertyMedia,
  updateProperty,
} from "@/app/actions/properties";
import type { PropertyRecord } from "@/app/lib/types";
import SearchableSelect from "./searchable-select";

type CityOption = { city: string; locations: string[] };

const LISTING_TYPES = [
  { value: "sale", label: "Sale" },
  { value: "rent", label: "Rent" },
  { value: "pg", label: "PG" },
  { value: "new_launch", label: "New Launch" },
];

const PROPERTY_TYPES = [
  "Flats",
  "Builder Floors",
  "Row House",
  "Villa",
  "Shop",
  "Office Space",
];

const BEDROOM_OPTIONS = [
  "1RK",
  "1BHK",
  "1.5BHK",
  "2BHK",
  "2.5BHK",
  "3BHK",
  "4BHK",
  "5BHK",
];

const AREA_UNITS = ["Sq.ft", "Sq.mt", "Acre", "Guntha", "Hectare"];

const FURNISHING_OPTIONS = ["Furnished", "Semi-furnished", "Unfurnished"];

const CONSTRUCTION_STATUSES = [
  "Ready to Move",
  "Under Construction",
  "Newly Launched",
];

const AMENITIES = [
  "Lift",
  "Power Backup",
  "Park",
  "Gymnasium",
  "Vaastu Compliant",
  "Swimming Pool",
  "Club House",
  "Gas Pipeline",
  "Security Personnel",
  "Wheelchair Friendly",
  "Pet Friendly",
  "Food Service",
  "Wifi",
  "Laundry Available",
];

const AVAILABLE_FOR_OPTIONS = [
  "Working Professionals",
  "Students",
  "Boys",
  "Girls",
  "Family",
  "Bachelor",
];

const PG_SERVICES = [
  "Wifi",
  "AC Room",
  "Food Service",
  "Laundry Service",
  "Laundry Available",
  "Wheelchair Friendly",
  "Pet Friendly",
];

const SHARING_OPTIONS = [
  "Private Room",
  "2 per Room",
  "More than 2 per Room",
];

const CAPACITY_OPTIONS = [
  "1-2 Guests",
  "2-4 Guests",
  "4-10 Guests",
  "10+ Guests",
];

const inputClass =
  "mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

const labelClass = "block text-sm font-medium text-zinc-700";

const MAX_THUMBNAIL_MB = 5;
const MAX_IMAGES_TOTAL_MB = 20;
const MAX_VIDEO_MB = 25;
const MAX_TOTAL_MB = 50;

function validateFiles(formData: FormData): string | null {
  const thumbnail = formData
    .getAll("thumbnail")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const images = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const videos = formData
    .getAll("videos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const thumbnailBytes = thumbnail.reduce((sum, file) => sum + file.size, 0);
  if (thumbnailBytes > MAX_THUMBNAIL_MB * 1024 * 1024) {
    return `Thumbnail exceeds the ${MAX_THUMBNAIL_MB}MB limit.`;
  }

  const imagesBytes = images.reduce((sum, file) => sum + file.size, 0);
  if (imagesBytes > MAX_IMAGES_TOTAL_MB * 1024 * 1024) {
    return `Property images exceed the ${MAX_IMAGES_TOTAL_MB}MB total limit.`;
  }

  if (videos.length > 1) {
    return "Only one video can be uploaded.";
  }
  const videoBytes = videos.reduce((sum, file) => sum + file.size, 0);
  if (videoBytes > MAX_VIDEO_MB * 1024 * 1024) {
    return `Video exceeds the ${MAX_VIDEO_MB}MB limit.`;
  }

  const total = thumbnailBytes + imagesBytes + videoBytes;
  if (total > MAX_TOTAL_MB * 1024 * 1024) {
    return `Total upload size exceeds ${MAX_TOTAL_MB}MB. Please remove some files.`;
  }

  return null;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

type MediaField = "thumbnail" | "images" | "videos";

function MediaButtons({
  propertyId,
  field,
  url,
  accept,
  onError,
}: {
  propertyId: string;
  field: MediaField;
  url: string;
  accept: string;
  onError: (message: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleDelete() {
    if (!window.confirm("Delete this media?")) return;
    setBusy(true);
    const result = await deletePropertyMedia({ propertyId, field, url });
    setBusy(false);
    if (!result?.success) {
      onError(result?.error ?? "Failed to delete media.");
    }
  }

  async function handleReplace(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    const result = await replacePropertyMedia({
      propertyId,
      field,
      url,
      file,
    });
    setBusy(false);
    if (!result?.success) {
      onError(result?.error ?? "Failed to replace media.");
    }
  }

  return (
    <div className="absolute right-1 top-1 flex gap-1">
      <button
        type="button"
        title="Replace"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-zinc-700 shadow hover:bg-white disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </button>
      <button
        type="button"
        title="Delete"
        disabled={busy}
        onClick={handleDelete}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600/90 text-white shadow hover:bg-red-600 disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleReplace}
      />
    </div>
  );
}

export default function AddPropertyModal({
  cities = [],
  property,
}: {
  cities?: CityOption[];
  property?: PropertyRecord;
}) {
  const isEdit = Boolean(property);
  const isDraft = property?.status === "draft";

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [parking, setParking] = useState(property?.parking?.available ?? false);
  const [listingType, setListingType] = useState(
    property?.listingType ?? "sale",
  );
  const [selectedCity, setSelectedCity] = useState(property?.city ?? "");
  const [selectedLocation, setSelectedLocation] = useState(
    property?.location ?? "",
  );
  const [generation, setGeneration] = useState(0);
  const isRentLike = listingType === "rent" || listingType === "pg";
  const isNewLaunch = listingType === "new_launch";
  const formRef = useRef<HTMLFormElement>(null);

  function openModal() {
    // Re-sync state from the latest props each time the modal opens.
    setParking(property?.parking?.available ?? false);
    setListingType(property?.listingType ?? "sale");
    setSelectedCity(property?.city ?? "");
    setSelectedLocation(property?.location ?? "");
    setError(null);
    setGeneration((value) => value + 1);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // FormData(form) alone omits the clicked submit button's name/value,
    // so append the submitter manually to capture "status".
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const formData = new FormData(event.currentTarget);
    if (submitter?.name) {
      formData.append(submitter.name, submitter.value);
    }

    const isDraftSubmit = formData.get("status") === "draft";

    if (!isDraftSubmit && !selectedCity) {
      setError("Please select a city.");
      return;
    }

    const fileError = validateFiles(formData);
    if (fileError) {
      setError(fileError);
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = property
        ? await updateProperty({ propertyId: property.id, formData })
        : await createProperty(formData);

      if (result?.success) {
        if (!property) {
          formRef.current?.reset();
          setParking(false);
          setListingType("sale");
          setSelectedCity("");
          setSelectedLocation("");
        }
        setOpen(false);
      } else {
        setError(result?.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  const hasExistingMedia = Boolean(
    property?.thumbnail ||
      (property?.images.length ?? 0) > 0 ||
      (property?.videos.length ?? 0) > 0,
  );

  return (
    <>
      {property ? (
        <button
          type="button"
          onClick={openModal}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          {isDraft ? "Continue" : "Edit"}
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Add Property
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-100 overflow-y-auto bg-black/50 p-4 text-left">
          {/* key={generation} remounts the form on every open so prefilled
              values always reflect the latest data. */}
          <div
            key={generation}
            className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                {!property || isDraft ? "Add Property" : "Edit Property"}
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

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="space-y-4 px-6 py-5"
            >
              <Field label="Listing type">
                <div className="mt-1 flex flex-wrap gap-2">
                  {LISTING_TYPES.map((type) => (
                    <label key={type.value} className="chip font-medium">
                      <input
                        type="radio"
                        name="listingType"
                        value={type.value}
                        checked={listingType === type.value}
                        onChange={() => setListingType(type.value)}
                        className="sr-only"
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </Field>

              {isNewLaunch ? (
                <Field label="Project Name">
                  <input
                    name="projectName"
                    type="text"
                    required
                    placeholder="e.g. Skyline Greens Phase 2"
                    defaultValue={property?.title ?? ""}
                    className={inputClass}
                  />
                </Field>
              ) : (
                <Field label="Property title">
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. 2BHK Flat in Kothrud"
                    defaultValue={property?.title ?? ""}
                    className={inputClass}
                  />
                </Field>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Property type">
                  <select
                    name="propertyType"
                    className={inputClass}
                    defaultValue={property?.propertyType ?? ""}
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                {listingType !== "pg" && !isNewLaunch && (
                  <Field label="Construction status">
                    <select
                      name="constructionStatus"
                      className={inputClass}
                      defaultValue={property?.constructionStatus ?? ""}
                    >
                      <option value="" disabled>
                        Select status
                      </option>
                      {CONSTRUCTION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {!isNewLaunch && (
                  <>
                    <Field label="Floor">
                      <input
                        name="floor"
                        type="number"
                        min="0"
                        defaultValue={property?.floor ?? ""}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Total floors">
                      <input
                        name="totalFloors"
                        type="number"
                        min="0"
                        defaultValue={property?.totalFloors ?? ""}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Bedrooms">
                      <select
                        name="bedrooms"
                        className={inputClass}
                        defaultValue={property?.bedrooms ?? ""}
                      >
                        <option value="" disabled>
                          Select bedrooms
                        </option>
                        {BEDROOM_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Furnishing">
                      <select
                        name="furnishing"
                        className={inputClass}
                        defaultValue={property?.furnishing ?? ""}
                      >
                        <option value="" disabled>
                          Select furnishing
                        </option>
                        {FURNISHING_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Area">
                      <input
                        name="area"
                        type="number"
                        min="0"
                        step="any"
                        defaultValue={property?.area ?? ""}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Area unit">
                      <select
                        name="areaUnit"
                        className={inputClass}
                        defaultValue={property?.areaUnit ?? ""}
                      >
                        <option value="" disabled>
                          Select unit
                        </option>
                        {AREA_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}

                {isNewLaunch ? (
                  <>
                    <Field label="Possession In">
                      <input
                        name="possessionIn"
                        type="text"
                        placeholder="e.g. Dec 2026"
                        defaultValue={property?.possessionIn ?? ""}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Starting From (₹)">
                      <input
                        name="startingFrom"
                        type="number"
                        min="0"
                        required
                        defaultValue={property?.startingFrom ?? ""}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Brochure (PDF)">
                      <input
                        name="brochure"
                        type="file"
                        accept="application/pdf,.pdf"
                        className={inputClass}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label={isRentLike ? "Rent (₹)" : "Price (₹)"}>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        required
                        defaultValue={property?.price ?? ""}
                        className={inputClass}
                      />
                    </Field>

                    {isRentLike && (
                      <Field label="Deposit amount (₹)">
                        <input
                          name="deposit"
                          type="number"
                          min="0"
                          defaultValue={property?.deposit ?? ""}
                          className={inputClass}
                        />
                      </Field>
                    )}
                  </>
                )}

                <Field label="City">
                  <input type="hidden" name="city" value={selectedCity} />
                  <div className="mt-1">
                    <SearchableSelect
                      value={selectedCity}
                      onChange={(value) => {
                        setSelectedCity(value);
                        setSelectedLocation("");
                      }}
                      options={cities.map((entry) => entry.city)}
                      placeholder="Search city…"
                    />
                  </div>
                </Field>

                <Field label="Location">
                  <input
                    type="hidden"
                    name="location"
                    value={selectedLocation}
                  />
                  <div className="mt-1">
                    <SearchableSelect
                      value={selectedLocation}
                      onChange={setSelectedLocation}
                      options={
                        cities.find((entry) => entry.city === selectedCity)
                          ?.locations ?? []
                      }
                      placeholder={
                        selectedCity ? "Search location…" : "Select a city first"
                      }
                    />
                  </div>
                </Field>

                {listingType === "rent" && (
                  <Field label="Available for">
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                      {AVAILABLE_FOR_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 text-sm text-zinc-700"
                        >
                          <input
                            type="checkbox"
                            name="availableFor"
                            value={option}
                            defaultChecked={property?.availableFor?.includes(
                              option,
                            )}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </Field>
                )}

                {listingType === "pg" && (
                  <Field label="Sharing option">
                    <select
                      name="sharingOption"
                      className={inputClass}
                      defaultValue={property?.sharingOption ?? ""}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {SHARING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {listingType === "pg" && (
                  <Field label="Total capacity">
                    <select
                      name="totalCapacity"
                      className={inputClass}
                      defaultValue={property?.totalCapacity ?? ""}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {CAPACITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {listingType === "pg" && (
                  <Field label="PG Services">
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                      {PG_SERVICES.map((service) => (
                        <label
                          key={service}
                          className="flex items-center gap-2 text-sm text-zinc-700"
                        >
                          <input
                            type="checkbox"
                            name="pgServices"
                            value={service}
                            defaultChecked={property?.pgServices?.includes(
                              service,
                            )}
                          />
                          {service}
                        </label>
                      ))}
                    </div>
                  </Field>
                )}
              </div>

              <Field label="Address">
                <textarea
                  name="address"
                  rows={3}
                  defaultValue={property?.address ?? ""}
                  className={inputClass}
                ></textarea>
              </Field>

              {!isNewLaunch && (
                <Field label="Parking">
                  <div className="mt-1 flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        name="parkingAvailable"
                        value="yes"
                        checked={parking}
                        onChange={() => setParking(true)}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        name="parkingAvailable"
                        value="no"
                        checked={!parking}
                        onChange={() => setParking(false)}
                      />
                      No
                    </label>
                  </div>
                </Field>
              )}

              {!isNewLaunch && parking && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="No. of parkings">
                    <input
                      name="parkingCount"
                      type="number"
                      min="1"
                      defaultValue={property?.parking?.count ?? ""}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Parking type">
                    <select
                      name="parkingType"
                      className={inputClass}
                      defaultValue={property?.parking?.type ?? ""}
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      <option value="Open Parking">Open Parking</option>
                      <option value="Covered Parking">Covered Parking</option>
                    </select>
                  </Field>
                </div>
              )}

              <Field label="Amenities">
                <div className="mt-1 flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => (
                    <label key={amenity} className="chip">
                      <input
                        type="checkbox"
                        name="amenities"
                        value={amenity}
                        defaultChecked={property?.amenities?.includes(amenity)}
                        className="sr-only"
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Thumbnail image">
                  <input
                    name="thumbnail"
                    type="file"
                    accept="image/*"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Max {MAX_THUMBNAIL_MB}MB
                  </p>
                </Field>

                <Field label="Property images">
                  <input
                    name="images"
                    type="file"
                    accept="image/*"
                    multiple
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Max {MAX_IMAGES_TOTAL_MB}MB for all images
                  </p>
                </Field>

                <Field label="Property video">
                  <input
                    name="videos"
                    type="file"
                    accept="video/*"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Single video, max {MAX_VIDEO_MB}MB
                  </p>
                </Field>
              </div>

              {isEdit && hasExistingMedia && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Current media
                  </p>
                  <div className="mt-3 flex flex-wrap items-start gap-4">
                    {property?.thumbnail && (
                      <div>
                        <div className="group relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={property.thumbnail}
                            alt="Current thumbnail"
                            className="h-20 w-28 rounded-lg border border-zinc-200 object-cover"
                          />
                          <MediaButtons
                            propertyId={property.id}
                            field="thumbnail"
                            url={property.thumbnail}
                            accept="image/*"
                            onError={setError}
                          />
                        </div>
                        <p className="mt-1 text-center text-xs text-zinc-500">
                          Thumbnail
                        </p>
                      </div>
                    )}
                    {(property?.images.length ?? 0) > 0 && (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {property!.images.map((image) => (
                            <div key={image} className="group relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image}
                                alt="Property image"
                                className="h-20 w-28 rounded-lg border border-zinc-200 object-cover"
                              />
                              <MediaButtons
                                propertyId={property!.id}
                                field="images"
                                url={image}
                                accept="image/*"
                                onError={setError}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {property!.images.length} image
                          {property!.images.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    )}
                    {(property?.videos.length ?? 0) > 0 && (
                      <div>
                        <div className="group relative">
                          <video
                            src={property!.videos[0]}
                            controls
                            className="h-20 w-32 rounded-lg border border-zinc-200 object-cover"
                          />
                          <MediaButtons
                            propertyId={property!.id}
                            field="videos"
                            url={property!.videos[0]}
                            accept="video/*"
                            onError={setError}
                          />
                        </div>
                        <p className="mt-1 text-center text-xs text-zinc-500">
                          Video
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Already-uploaded media is kept unless you upload
                    replacements.
                  </p>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
                <button
                  type="submit"
                  name="status"
                  value="draft"
                  formNoValidate
                  disabled={pending}
                  className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save Draft"}
                </button>
                <button
                  type="submit"
                  name="status"
                  value="published"
                  disabled={pending}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {pending
                    ? "Saving…"
                    : !property || isDraft
                      ? "Add Property"
                      : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
