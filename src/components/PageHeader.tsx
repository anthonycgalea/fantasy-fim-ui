export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-extrabold">{title}</h1>
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
