// Shared frame for the auth pages: a centred card with a heading and a footer line.
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="card flex flex-col gap-space-md p-space-lg md:p-space-xl lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <header className="flex flex-col gap-1">
        <h1 className="type-headline-md">{title}</h1>
        {subtitle && <p className="type-body-md text-neutral-700">{subtitle}</p>}
      </header>
      {children}
      {footer && <p className="type-body-sm border-t border-neutral-200 pt-space-sm text-center text-neutral-700">{footer}</p>}
    </div>
  );
}
