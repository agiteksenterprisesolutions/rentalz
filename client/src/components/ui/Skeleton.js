// Grey placeholder block used while a page loads. Decorative, so hidden from screen readers.
export default function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-neutral-200/70 motion-reduce:animate-none ${className}`} />;
}
