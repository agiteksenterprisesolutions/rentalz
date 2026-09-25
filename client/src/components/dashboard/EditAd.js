"use client";

import useFetch from "@/hooks/useFetch";
import AdForm from "./AdForm";
import { LoadState } from "./parts";

export default function EditAd({ slug, ...lists }) {
  const { data, error, loading, reload } = useFetch(`/ads/${encodeURIComponent(slug)}`);
  return (
    <LoadState loading={loading} error={error} onRetry={reload}>
      {data && <AdForm ad={data} {...lists} />}
    </LoadState>
  );
}
