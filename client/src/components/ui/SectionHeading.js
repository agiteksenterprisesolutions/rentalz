export default function SectionHeading({ id, eyebrow, title, description, align = "left", inverse = false, children }) {
  return (
    <div className={`flex flex-col gap-space-sm ${align === "center" ? "mx-auto max-w-2xl items-center text-center" : "max-w-2xl"}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className={`type-headline-lg ${inverse ? "text-white" : ""}`}>
        {title}
      </h2>
      {description && <p className={`type-body-lg ${inverse ? "text-white/70" : "text-neutral-700"}`}>{description}</p>}
      {children}
    </div>
  );
}
