"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/api/api";
import { apiError } from "@/hooks/useFetch";

export const MAX_PHOTOS = 15;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

const checkFiles = (files, room) => {
  if (files.length > room) return `You can add ${room} more ${room === 1 ? "photo" : "photos"} (maximum ${MAX_PHOTOS}).`;
  const bad = files.find((f) => !ACCEPT.split(",").includes(f.type));
  if (bad) return `“${bad.name}” isn't a JPG, PNG or WebP image.`;
  const big = files.find((f) => f.size > MAX_BYTES);
  if (big) return `“${big.name}” is larger than 5 MB.`;
  return null;
};

function Tile({ src, label, onRemove, busy }) {
  return (
    <li className="relative aspect-square overflow-hidden rounded-control border border-neutral-200 bg-white">
      <Image src={src} alt="" fill unoptimized={src.startsWith("blob:")} sizes="150px" className="object-cover" />
      <button type="button" onClick={onRemove} disabled={busy} aria-label={label} className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-neutral-900/80 text-white hover:bg-neutral-900 disabled:opacity-50">
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}

// Photo manager. With `adId` it works on the saved ad (each add or remove is sent to the API straight away).
// Without one it collects files locally and hands them to the parent through `files` / `onFiles` for the create request.
export default function AdPhotos({ adId, initial = [], files = [], onFiles }) {
  const input = useRef(null);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Object URLs for the not-yet-uploaded files; released when the list changes.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const count = adId ? saved.length : files.length;

  const onPick = async (event) => {
    const picked = [...event.target.files];
    event.target.value = "";
    if (!picked.length) return;
    const problem = checkFiles(picked, MAX_PHOTOS - count);
    if (problem) return setError(problem);
    setError(null);

    if (!adId) return onFiles([...files, ...picked]);

    setBusy(true);
    try {
      const body = new FormData();
      picked.forEach((f) => body.append("photos", f));
      const { data } = await api.post(`/ads/${adId}/photos`, body);
      setSaved(data.data.photos ?? [...saved]);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const removeSaved = async (photo) => {
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/ads/${adId}/photos/${photo.id}`);
      setSaved((list) => list.filter((p) => p.id !== photo.id));
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-space-sm flex items-center justify-between">
        <span className="label mb-0">Photos <span className="font-normal text-neutral-700">({count} of {MAX_PHOTOS})</span></span>
        <button type="button" onClick={() => input.current.click()} disabled={busy || count >= MAX_PHOTOS} className="btn btn-secondary btn-sm">
          <ImagePlus aria-hidden="true" />
          {busy ? "Uploading…" : "Add photos"}
        </button>
      </div>
      <input ref={input} type="file" accept={ACCEPT} multiple onChange={onPick} className="sr-only" tabIndex={-1} aria-hidden="true" />
      {error && <p role="alert" className="field-error mb-space-sm">{error}</p>}
      {count === 0 ? (
        <p className="type-body-sm rounded-control border border-dashed border-neutral-300 p-space-lg text-center text-neutral-700">Ads with clear photos get far more calls. JPG, PNG or WebP, up to 5 MB each. The first photo is the cover.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {adId
            ? saved.map((p, i) => <Tile key={p.id} src={p.url} busy={busy} label={`Remove photo ${i + 1}`} onRemove={() => removeSaved(p)} />)
            : files.map((f, i) => previews[i] && <Tile key={`${f.name}-${f.size}-${i}`} src={previews[i]} label={`Remove ${f.name}`} onRemove={() => onFiles(files.filter((_, j) => j !== i))} />)}
        </ul>
      )}
    </div>
  );
}
