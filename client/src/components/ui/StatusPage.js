// Full-width message for system pages (404, errors). `code` is the big monospace label, `children` the actions.
export default function StatusPage({ code, title, text, children, note }) {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-start justify-center gap-space-md py-space-2xl md:items-center md:text-center">
      <p className="type-label-mono-md rounded-control border border-neutral-200 bg-white px-3 py-1 tracking-[0.16em] text-neutral-700">{code}</p>
      <h1 className="type-display-xl max-w-3xl">{title}</h1>
      <p className="type-body-lg max-w-xl text-neutral-700">{text}</p>
      {children && <div className="mt-space-sm flex flex-wrap gap-space-sm md:justify-center">{children}</div>}
      {note && <p className="type-label-mono-md text-neutral-700">{note}</p>}
    </section>
  );
}
