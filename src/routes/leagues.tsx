import { createFileRoute } from "@tanstack/react-router";
import { useLeagues } from "@/api/useLeagues";
import { PageHeader, EmptyPanel } from "@/components/PageHeader";

export const Route = createFileRoute("/leagues")({
  head: () => ({
    meta: [
      { title: "Leagues · Fantasy FiM" },
      { name: "description", content: "Browse and join Fantasy FIRST in Michigan leagues." },
      { property: "og:title", content: "Leagues · Fantasy FiM" },
      { property: "og:description", content: "Browse and join Fantasy FIRST in Michigan leagues." },
    ],
  }),
  component: LeaguesPage,
});

export function LeaguesPage() {
  const leagues = useLeagues();
  const fimLeagues = leagues.data?.filter((league) => league.is_fim) ?? [];

  return (
    <>
      <PageHeader kicker="// leagues" title="Leagues">Your leagues, drafts and rosters.</PageHeader>
      {leagues.isPending ? (
        <div role="status"><EmptyPanel label="Loading leagues…" /></div>
      ) : leagues.isError ? (
        <div role="alert" className="rounded-2xl border bg-card p-12 text-center shadow-soft">
          <p>Leagues couldn’t be loaded. Please try again.</p>
          <button type="button" onClick={() => leagues.refetch()} disabled={leagues.isFetching}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {leagues.isFetching ? "Retrying…" : "Try again"}
          </button>
        </div>
      ) : fimLeagues.length === 0 ? (
        <EmptyPanel label="No FiM leagues are available yet." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="FiM leagues">
          {fimLeagues.map((league) => (
            <li key={league.league_id} className="rounded-2xl border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold">{league.league_name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {league.year}{league.offseason ? " · Offseason" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
