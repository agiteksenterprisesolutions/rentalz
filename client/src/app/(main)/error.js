"use client";

import ErrorView from "@/components/ui/ErrorView";

// A failure while rendering a public page: the header and footer from the layout stay in place.
export default function Error({ error, retry }) {
  return <ErrorView error={error} retry={retry} />;
}
