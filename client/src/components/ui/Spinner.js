// Accessible loading indicator. The spinner stops turning for people who ask for reduced motion.
export default function Spinner({ label = "Loading…", className = "" }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-space-md ${className}`}>
      <span aria-hidden="true" className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-amber motion-reduce:animate-none" />
      <span className="type-body-md text-neutral-700">{label}</span>
    </div>
  );
}
