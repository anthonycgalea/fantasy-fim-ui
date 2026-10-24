import { Link, Outlet } from "@tanstack/react-router";
import { useLeague, useLeagueDrafts } from "@/api/drafts";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";

const views = [
  { label: "Rankings", to: "/leagues/$leagueId/rankings" },
  { label: "Scores/Lineups", to: "/leagues/$leagueId/scores" },
  { label: "Rosters", to: "/leagues/$leagueId/rosters" },
  { label: "Available Teams", to: "/leagues/$leagueId/available" },
  { label: "Waivers", to: "/leagues/$leagueId/waivers" },
] as const;
export function LeagueLayout({ leagueId }: { leagueId: string }) {
  const league = useLeague(Number(leagueId));
  const drafts = useLeagueDrafts(leagueId);
  if (league.isError)
    return (
      <ErrorPanel
        label="League information couldn’t be loaded."
        retry={() => {
          void league.refetch();
        }}
        busy={league.isFetching}
      />
    );
  if (!league.data) return <LoadingPanel label="Loading league information…" />;
  const firstDraft = drafts.data?.[0];
  const navClass =
    "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={league.data.league_name}>
          {league.data.year} · {league.data.weekly_starts} weekly starts · Rankings, lineups and
          rosters.
        </PageHeader>
        <Button asChild variant="outline">
          <Link to={league.data.offseason ? "/offseasons" : "/leagues"}>
            All {league.data.offseason ? "offseasons" : "leagues"}
          </Link>
        </Button>
      </div>
      <nav
        aria-label="League navigation"
        className="mb-8 flex flex-wrap gap-1 rounded-2xl border bg-card p-2 shadow-soft"
      >
        {views.map((view) => (
          <Link
            key={view.to}
            to={view.to}
            params={{ leagueId }}
            className={navClass}
            activeProps={{ className: "bg-accent text-accent-foreground" }}
          >
            {view.label}
          </Link>
        ))}
        {league.data.is_fim && firstDraft ? (
          <Link
            to="/drafts/$draftId"
            params={{ draftId: String(firstDraft.draft_id) }}
            search={{ autoRefreshInterval: false }}
            className={navClass}
          >
            Draft
          </Link>
        ) : (
          <Link
            to="/leagues/$leagueId/drafts"
            params={{ leagueId }}
            className={navClass}
            activeProps={{ className: "bg-accent text-accent-foreground" }}
          >
            Drafts
          </Link>
        )}
      </nav>
      <Outlet />
    </>
  );
}
