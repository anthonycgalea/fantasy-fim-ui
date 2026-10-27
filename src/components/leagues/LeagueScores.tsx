import { useState } from "react";
import { useCurrentWeek, useLeague } from "@/api/drafts";
import { useLineups, useLeagueScores } from "@/api/leagues";
import { EmptyPanel } from "@/components/PageHeader";
import { ScoreRow } from "@/components/scores/ScoreRow";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";

export function LeagueScores({ leagueId }: { leagueId: string }) {
  const lineups = useLineups(leagueId);
  const league = useLeague(Number(leagueId));
  const currentWeek = useCurrentWeek(league.data?.year);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const weeks = [...new Set(lineups.data?.map((lineup) => lineup.week) ?? [])].sort(
    (a, b) => a - b,
  );
  const defaultWeek =
    currentWeek.data?.year === league.data?.year && weeks.includes(currentWeek.data?.week ?? -1)
      ? currentWeek.data?.week
      : weeks[0];
  const activeWeek =
    selectedWeek !== null && weeks.includes(selectedWeek) ? selectedWeek : defaultWeek;
  const scores = useLeagueScores(leagueId, activeWeek);
  const queries = [lineups, league, currentWeek];
  if (queries.some((query) => query.isError))
    return (
      <ErrorPanel
        label="Lineups couldn’t be loaded."
        retry={() => {
          queries.forEach((query) => {
            if (query.isError) void query.refetch();
          });
        }}
      />
    );
  if (!lineups.data || !league.data || currentWeek.isPending)
    return <LoadingPanel label="Loading scores and lineups…" />;
  if (!weeks.length)
    return <EmptyPanel label="No lineups have been submitted for this league yet." />;
  const weekLineup = lineups.data.find((lineup) => lineup.week === activeWeek);
  const maxTeamCount = Math.max(
    0,
    ...(weekLineup?.fantasy_teams.map((team) => team.teams.length) ?? []),
  );
  return (
    <section aria-labelledby="league-scores-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="league-scores-title" className="text-xl font-bold">
            Scores / Lineups
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly starters, scores and ranking points. Expand a score to see its breakdown.
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          Week
          <select
            aria-label="Week"
            value={activeWeek}
            onChange={(event) => setSelectedWeek(Number(event.target.value))}
            className="rounded-xl border bg-card px-4 py-2 text-sm"
          >
            {weeks.map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
        </label>
      </div>
      {scores.isError && (
        <div className="mb-4">
          <ErrorPanel
            label="Scores couldn’t be loaded. Lineups are shown below."
            retry={() => {
              void scores.refetch();
            }}
            busy={scores.isFetching}
          />
        </div>
      )}
      {scores.isPending && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Loading week {activeWeek} scores…
        </p>
      )}
      {!weekLineup?.fantasy_teams.length ? (
        <EmptyPanel label="No lineups are available for this week." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {weekLineup.fantasy_teams.map((lineup) => {
            const score = scores.data?.find(
              (team) => team.fantasy_team_id === lineup.fantasy_team_id,
            );
            return (
              <section
                key={`${activeWeek}-${lineup.fantasy_team_id}`}
                aria-label={lineup.fantasy_team_name}
                className="rounded-2xl border bg-card p-6 shadow-soft"
              >
                <h3 className="mb-5 text-lg font-bold">{lineup.fantasy_team_name}</h3>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Team #</span>
                  <span>Score</span>
                </div>
                {Array.from({ length: maxTeamCount }, (_, index) => {
                  const teamNumber = lineup.teams[index]?.team_number;
                  const teamScore = score?.teams.find((team) => team.team_number === teamNumber);
                  return (
                    <ScoreRow
                      key={index}
                      teamNumber={teamNumber}
                      score={teamScore?.weekly_score}
                      breakdown={teamScore?.breakdown}
                    />
                  );
                })}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-2xl font-extrabold text-primary">
                    {score?.weekly_score ?? "—"}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                  <span>Rank points</span>
                  <span className="font-semibold">{score?.rank_points ?? "—"}</span>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
