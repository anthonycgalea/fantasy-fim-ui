import { Link } from "@tanstack/react-router";
import { useLeagueDrafts } from "@/api/drafts";
import { EmptyPanel } from "@/components/PageHeader";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";
export function LeagueDrafts({ leagueId }: { leagueId: string }) {
  const drafts = useLeagueDrafts(leagueId);
  if (drafts.isError)
    return (
      <ErrorPanel
        label="League drafts couldn’t be loaded."
        retry={() => {
          void drafts.refetch();
        }}
        busy={drafts.isFetching}
      />
    );
  if (drafts.isPending) return <LoadingPanel label="Loading league drafts…" />;
  return (
    <section aria-labelledby="league-drafts-title">
      <h2 id="league-drafts-title" className="mb-5 text-xl font-bold">
        Drafts
      </h2>
      {!drafts.data.length ? (
        <EmptyPanel label="No drafts have been scheduled for this league yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...drafts.data]
            .sort((a, b) => b.draft_id - a.draft_id)
            .map((draft) => (
              <Link
                key={draft.draft_id}
                to="/drafts/$draftId"
                params={{ draftId: String(draft.draft_id) }}
                search={{ autoRefreshInterval: 15000 }}
                className="rounded-2xl border bg-card p-6 shadow-soft transition hover:border-primary/50 hover:bg-accent/30"
              >
                <span className="text-xs font-semibold text-muted-foreground">
                  Draft {draft.draft_id}
                </span>
                <h3 className="mt-2 text-xl font-bold">{draft.event_key || "League draft"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{draft.rounds} rounds</p>
                <span className="mt-5 inline-block text-sm font-semibold text-primary">
                  View draft →
                </span>
              </Link>
            ))}
        </div>
      )}
    </section>
  );
}
