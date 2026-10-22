export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
        {kicker.replace("// ", "")}
      </span>
      <h1 className="mt-3 text-4xl font-extrabold">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-muted-foreground">{children}</p>}
    </div>
  );
}

export function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground shadow-soft">
      {label}
    </div>
  );
}