// Long-form legal text. `sections` is [{ title, body: [paragraph | [list items]] }].
export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <div className="container-page py-space-xl">
      <article className="max-w-3xl">
        <h1 className="type-headline-lg">{title}</h1>
        <p className="type-label-mono-md mt-space-sm text-neutral-700">Last updated {updated}</p>
        {intro && <p className="type-body-lg mt-space-lg">{intro}</p>}
        <div className="mt-space-xl flex flex-col gap-space-xl">
          {sections.map((s, i) => (
            <section key={s.title} aria-labelledby={`s${i}`}>
              <h2 id={`s${i}`} className="type-headline-md mb-space-sm">{i + 1}. {s.title}</h2>
              <div className="flex flex-col gap-space-sm">
                {s.body.map((block, j) =>
                  Array.isArray(block) ? (
                    <ul key={j} className="type-body-md ml-5 list-disc text-neutral-700">{block.map((item) => <li key={item} className="mt-1">{item}</li>)}</ul>
                  ) : (
                    <p key={j} className="type-body-md text-neutral-700">{block}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
