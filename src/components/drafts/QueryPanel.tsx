import { EmptyPanel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export function LoadingPanel({ label }: { label: string }) {
  return (
    <div role="status">
      <EmptyPanel label={label} />
    </div>
  );
}
export function ErrorPanel({
  label,
  retry,
  busy = false,
}: {
  label: string;
  retry: () => void;
  busy?: boolean;
}) {
  return (
    <div role="alert" className="rounded-2xl border bg-card p-8 text-center shadow-soft">
      <p className="mb-4 text-sm text-muted-foreground">{label}</p>
      <Button variant="outline" onClick={retry} disabled={busy}>
        {busy ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
