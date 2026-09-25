import { AlertCircle } from "lucide-react";

const STATUS = {
  DRAFT: ["Draft", ""],
  PENDING: ["In review", ""],
  APPROVED: ["Live", "pill-available"],
  REJECTED: ["Rejected", ""],
  EXPIRED: ["Expired", ""],
  SOLD: ["Sold", ""],
};

export const STATUS_LABELS = Object.fromEntries(Object.entries(STATUS).map(([k, [label]]) => [k, label]));

export function StatusPill({ status }) {
  const [label, tone] = STATUS[status] ?? [status, ""];
  return <span className={`pill pill-sm ${tone}`}>{label}</span>;
}

export function PageHeading({ title, subtitle, action }) {
  return (
    <div className="mb-space-lg flex flex-wrap items-end justify-between gap-space-md">
      <div>
        <h1 className="type-headline-lg">{title}</h1>
        {subtitle && <p className="type-body-md mt-space-sm text-neutral-700">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadState({ loading, error, onRetry, children }) {
  if (loading) return <p role="status" className="type-body-md text-neutral-700">Loading…</p>;
  if (error) {
    return (
      <div role="alert" className="card flex items-start gap-3 p-space-md">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error" />
        <div className="flex flex-col items-start gap-space-sm">
          <p className="type-body-md">{error}</p>
          {onRetry && <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm">Try again</button>}
        </div>
      </div>
    );
  }
  return children;
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="card flex flex-col items-center gap-space-md p-space-xl text-center">
      <h2 className="type-headline-md">{title}</h2>
      {text && <p className="type-body-md max-w-md text-neutral-700">{text}</p>}
      {action}
    </div>
  );
}
