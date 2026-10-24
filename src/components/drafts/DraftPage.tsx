import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  getEpaYear,
  useCurrentWeek,
  useDraft,
  useDraftOrder,
  useDraftPicks,
  useFantasyTeams,
  useLeague,
} from "@/api/drafts";
import { Button } from "@/components/ui/button";
import { AvailableTeams } from "./AvailableTeams";
import { DraftBoard } from "./DraftBoard";
import { LeagueWeeks } from "./LeagueWeeks";
import { ErrorPanel, LoadingPanel } from "./QueryPanel";

export function DraftPage({
  draftId,
  interval = false,
  initialTab = "draft",
}: {
  draftId: string;
  interval?: number | false;
  initialTab?: "draft" | "leagueWeeks";
}) {
  const [tab, setTab] = useState(initialTab);
  const navigate = useNavigate();
  const draft = useDraft(draftId);
  const league = useLeague(draft.data?.league_id);
  const picks = useDraftPicks(draftId, interval);
  const order = useDraftOrder(draftId);
  const teams = useFantasyTeams(draft.data?.league_id);
  const currentWeek = useCurrentWeek();
  const headerQueries = [draft, league];
  if (headerQueries.some((query) => query.isError))
    return (
      <ErrorPanel
        label="Draft information couldn’t be loaded."
        retry={() => {
          headerQueries.forEach((query) => {
            if (query.isError) void query.refetch();
          });
        }}
      />
    );
  if (!draft.data || !league.data) return <LoadingPanel label="Loading draft information…" />;
  const activeTab = league.data.offseason ? "draft" : tab;
  const boardQueries = [picks, teams, ...(activeTab === "draft" ? [order] : [])];
  const epaYear = getEpaYear(league.data, currentWeek.data);
  return (
    <>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-l-4 border-l-primary bg-card px-4 py-3 shadow-soft sm:px-5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-xl font-extrabold sm:text-2xl">{league.data.league_name}</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {league.data.year}
            {draft.data.event_key ? ` · ${draft.data.event_key}` : ""} · {draft.data.rounds} rounds
          </p>
        </div>
        {league.data.offseason ? (
          <Button asChild>
            <Link to="/drafts/$draftId/scores" params={{ draftId }}>
              View Draft Scores
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/leagues/$leagueId" params={{ leagueId: String(league.data.league_id) }}>
              Back to League
            </Link>
          </Button>
        )}
      </header>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        {!league.data.offseason ? (
          <div
            role="group"
            aria-label="Draft views"
            className="flex gap-2 rounded-full bg-muted p-1"
          >
            <Button
              variant={activeTab === "draft" ? "default" : "ghost"}
              aria-pressed={activeTab === "draft"}
              onClick={() => setTab("draft")}
            >
              Draft
            </Button>
            <Button
              variant={activeTab === "leagueWeeks" ? "default" : "ghost"}
              aria-pressed={activeTab === "leagueWeeks"}
              onClick={() => setTab("leagueWeeks")}
            >
              League Weeks
            </Button>
          </div>
        ) : (
          <Button asChild variant="outline">
            <Link to="/offseasons">All offseasons</Link>
          </Button>
        )}
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          Auto-refresh
          <select
            aria-label="Auto-refresh"
            value={interval || "off"}
            onChange={(event) => {
              void navigate({
                to: "/drafts/$draftId",
                params: { draftId },
                search: {
                  autoRefreshInterval:
                    event.target.value === "off" ? false : Number(event.target.value),
                },
                replace: true,
              });
            }}
            className="rounded-lg border bg-card px-3 py-2 text-foreground"
          >
            <option value="off">Off</option>
            {interval && ![5000, 15000, 30000].includes(interval) && (
              <option value={interval}>{interval / 1000} seconds</option>
            )}
            <option value="5000">5 seconds</option>
            <option value="15000">15 seconds</option>
            <option value="30000">30 seconds</option>
          </select>
        </label>
      </div>
      {boardQueries.some((query) => query.isError) ? (
        <ErrorPanel
          label="Draft data couldn’t be loaded."
          retry={() => {
            boardQueries.forEach((query) => {
              if (query.isError) void query.refetch();
            });
          }}
        />
      ) : boardQueries.some((query) => query.isPending) ? (
        <LoadingPanel
          label={activeTab === "draft" ? "Loading draft board…" : "Loading league weeks…"}
        />
      ) : activeTab === "draft" ? (
        <DraftBoard
          order={order.data ?? []}
          picks={picks.data ?? []}
          teams={teams.data ?? []}
          rounds={draft.data.rounds}
          year={league.data.year}
          epaYear={epaYear}
        />
      ) : (
        <LeagueWeeks
          teams={teams.data ?? []}
          picks={picks.data ?? []}
          weeklyStarts={league.data.weekly_starts}
        />
      )}
      {activeTab === "draft" && (
        <AvailableTeams
          draftId={draftId}
          isFim={league.data.is_fim}
          epaYear={epaYear}
          interval={interval}
        />
      )}
    </>
  );
}
