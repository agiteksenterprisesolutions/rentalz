import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Numbered pages as plain links, so they work without JavaScript and can be crawled.
// `buildHref(page)` returns the URL for a page number.
export default function Pagination({ page, totalPages, buildHref }) {
  if (totalPages <= 1) return null;

  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const item = "btn btn-sm min-w-10";

  return (
    <nav aria-label="Pagination" className="mt-space-xl flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} rel="prev" className={`${item} btn-secondary`}>
          <ChevronLeft aria-hidden="true" /> Previous
        </Link>
      ) : null}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span aria-hidden="true" className="text-neutral-400">…</span>}
          <Link href={buildHref(p)} aria-current={p === page ? "page" : undefined} className={`${item} ${p === page ? "btn-primary" : "btn-secondary"}`}>
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} rel="next" className={`${item} btn-secondary`}>
          Next <ChevronRight aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
