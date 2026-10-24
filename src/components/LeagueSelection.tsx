import { useState } from "react";
import { useLeagues } from "@/api/useLeagues";
import { YearSelector } from "@/components/YearSelector";
import { EmptyPanel } from "@/components/PageHeader";

export function LeagueSelection({ offseason = false }: { offseason?: boolean }) {
  const [year, setYear] = useState(2026);
  const leagues = useLeagues(offseason ? undefined : year);
  const title = offseason ? "Offseasons" : "Leagues";
  const label = offseason ? "offseasons" : "leagues";
  const visibleLeagues = (
    leagues.data?.filter((league) => (offseason ? league.offseason : league.is_fim)) ?? []
  ).sort((a, b) => b.league_id - a.league_id);

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          {!offseason && <YearSelector label="League year" year={year} onChange={setYear} />}
          <h1 className="text-4xl font-extrabold">{title}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {offseason
            ? "Your offseason leagues, drafts and rosters."
            : "Your leagues, drafts and rosters."}
        </p>
      </div>
      {leagues.isPending ? (
        <div role="status">
          <EmptyPanel label={`Loading ${label}…`} />
        </div>
      ) : leagues.isError ? (
        <div role="alert" className="rounded-2xl border bg-card p-12 text-center shadow-soft">
          <p>{title} couldn’t be loaded. Please try again.</p>
          <button
            type="button"
            onClick={() => leagues.refetch()}
            disabled={leagues.isFetching}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {leagues.isFetching ? "Retrying…" : "Try again"}
          </button>
        </div>
      ) : visibleLeagues.length === 0 ? (
        <EmptyPanel
          label={
            offseason ? "No offseasons are available yet." : "No FiM leagues are available yet."
          }
        />
      ) : (
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={offseason ? "Offseason leagues" : "FiM leagues"}
        >
          {visibleLeagues.map((league) => (
            <li key={league.league_id} className="rounded-2xl border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold">
                <a
                  href={`/leagues/${league.league_id}`}
                  className="hover:text-primary hover:underline"
                >
                  {league.league_name}
                </a>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {league.year}
                {league.offseason ? " · Offseason" : ""}
              </p>
              <a
                href={`/leagues/${league.league_id}`}
                className="mt-4 inline-block text-sm font-semibold text-primary"
              >
                View league →
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
