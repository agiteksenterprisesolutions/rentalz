// Every section opens the same way: an amber rule and a mono label (.eyebrow), the headline, and a
// measure line running off to the right of it. The repetition is what makes the pages feel like one set.
export default function SectionHeading({ id, eyebrow, title, description, align = "left", inverse = false, children }) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto flex max-w-2xl flex-col items-center gap-space-sm text-center" : "flex w-full flex-col gap-space-sm"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <div className={`flex items-center gap-space-lg ${centered ? "justify-center" : ""}`}>
        <h2 id={id} className={`type-headline-lg ${inverse ? "text-white" : ""}`}>
          {title}
        </h2>
        {!centered && <span aria-hidden="true" className="rule-hair hidden sm:block" />}
      </div>
      {description && <p className={`type-body-lg max-w-2xl ${inverse ? "text-white/70" : "text-neutral-700"}`}>{description}</p>}
      {children}
    </div>
  );
}
