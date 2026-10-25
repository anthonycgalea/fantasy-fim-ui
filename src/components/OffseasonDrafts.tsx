import { useCallback, useEffect, useRef, useState } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { fetchApi, type Draft } from "@/api/drafts";
import { useLeagues, type League } from "@/api/useLeagues";
import { YearSelector } from "@/components/YearSelector";
import { EmptyPanel } from "@/components/PageHeader";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";

function OffseasonCard({
  league,
  query,
  onVisible,
}: {
  league: League;
  query: UseQueryResult<Draft[], Error>;
  onVisible: (id: number) => void;
}) {
  const card = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const element = card.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      onVisible(league.league_id);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible(league.league_id);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [league.league_id, onVisible]);

  if (query.isSuccess && !query.data.length) return null;
  const latest = query.data?.reduce<Draft | undefined>(
    (largest, draft) => (!largest || draft.draft_id > largest.draft_id ? draft : largest),
    undefined,
  );
  const cardClass =
    "block h-full w-full rounded-2xl border bg-card p-6 text-left shadow-soft transition hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-2 focus-visible:outline-ring";
  return (
    <li ref={card}>
      {latest ? (
        <Link
          to="/drafts/$draftId"
          params={{ draftId: String(latest.draft_id) }}
          search={{ autoRefreshInterval: 15000 }}
          className={cardClass}
        >
          <h2 className="text-lg font-bold">{league.league_name}</h2>
        </Link>
      ) : query.isError ? (
        <button
          type="button"
          className={cardClass}
          title="Draft couldn’t be loaded. Click to retry."
          onClick={() => {
            void query.refetch();
          }}
        >
          <h2 className="text-lg font-bold">{league.league_name}</h2>
        </button>
      ) : (
        <div className={cardClass}>
          <h2 className="text-lg font-bold">{league.league_name}</h2>
        </div>
      )}
    </li>
  );
}

export function OffseasonDrafts() {
  const [year, setYear] = useState(2026);
  const leagues = useLeagues(year);
  const [visibleIds, setVisibleIds] = useState(() => new Set<number>());
  const onVisible = useCallback((id: number) => {
    setVisibleIds((previous) => (previous.has(id) ? previous : new Set([...previous, id])));
  }, []);
  const offseasons = (leagues.data?.filter((league) => league.offseason) ?? []).sort(
    (a, b) => b.league_id - a.league_id,
  );
  const drafts = useQueries({
    queries: offseasons.map((league) => ({
      queryKey: ["leagueDrafts", String(league.league_id)],
      enabled: visibleIds.has(league.league_id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchApi<Draft[]>(`/leagues/${league.league_id}/drafts`, signal),
    })),
  });
  return (
    <>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <YearSelector label="Offseason year" year={year} onChange={setYear} />
          <h1 className="text-4xl font-extrabold">Offseasons</h1>
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Choose an offseason to view its latest draft and scores.
        </p>
      </div>
      {leagues.isPending ? (
        <LoadingPanel label="Loading offseasons…" />
      ) : leagues.isError ? (
        <ErrorPanel
          label="Offseasons couldn’t be loaded. Please try again."
          retry={() => {
            void leagues.refetch();
          }}
          busy={leagues.isFetching}
        />
      ) : !offseasons.length ? (
        <EmptyPanel label="No offseasons are available yet." />
      ) : drafts.every((query) => query.isSuccess && !query.data.length) ? (
        <EmptyPanel label="No offseason drafts are available yet." />
      ) : (
        <ul aria-label="Offseason drafts" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offseasons.map((league, index) =>
            drafts[index] ? (
              <OffseasonCard
                key={league.league_id}
                league={league}
                query={drafts[index]}
                onVisible={onVisible}
              />
            ) : null,
          )}
        </ul>
      )}
    </>
  );
}
