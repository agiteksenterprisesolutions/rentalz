import { AlertCircle, CheckCircle2 } from "lucide-react";

// Inline result message. Errors are announced immediately (role=alert), successes politely (role=status).
export default function Notice({ tone = "error", children }) {
  if (!children) return null;
  const isError = tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div role={isError ? "alert" : "status"} className={`type-body-sm flex gap-2 rounded-xl border p-space-md ${isError ? "border-error/30 bg-error-container text-on-error-container" : "border-neutral-200 bg-surface-container-low text-neutral-900"}`}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
