import { ScoreRow } from "@/components/scores/ScoreRow";
import { Link } from "@tanstack/react-router";
import { useDraft, useDraftScores, useLeague } from "@/api/drafts";
import { EmptyPanel, PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ErrorPanel, LoadingPanel } from "./QueryPanel";

export function DraftScores({ draftId }: { draftId: string }) {
  const draft = useDraft(draftId);
  const league = useLeague(draft.data?.league_id);
  const scores = useDraftScores(draftId);
  const queries = [draft, league, scores];
  if (queries.some((query) => query.isError))
    return (
      <ErrorPanel
        label="Draft scores couldn’t be loaded."
        retry={() => {
          queries.forEach((query) => {
            if (query.isError) void query.refetch();
          });
        }}
      />
    );
  if (!draft.data || !league.data || !scores.data)
    return <LoadingPanel label="Loading draft scores…" />;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader kicker="// draft scores" title={league.data.league_name}>
          {draft.data.event_key} · {league.data.year} · {league.data.weekly_starts} scoring starts
        </PageHeader>
        <Button asChild variant="outline">
          <Link to="/drafts/$draftId" params={{ draftId }} search={{ autoRefreshInterval: false }}>
            View Draft
          </Link>
        </Button>
      </div>
      {!scores.data.length ? (
        <EmptyPanel label="Scores aren’t available for this draft yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scores.data.map((team) => (
            <section
              key={team.fantasy_team_id}
              className="rounded-2xl border bg-card p-6 shadow-soft"
              aria-label={team.fantasy_team_name}
            >
              <h2 className="mb-5 text-lg font-bold">{team.fantasy_team_name}</h2>
              <div className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Team #</span>
                <span>Score</span>
              </div>
              {Array.from({ length: Math.max(0, league.data.weekly_starts) }, (_, index) => (
                <ScoreRow
                  key={index}
                  teamNumber={team.teams[index]?.team_number}
                  score={team.teams[index]?.event_score}
                  breakdown={team.teams[index]?.breakdown}
                />
              ))}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-2xl font-extrabold text-primary">{team.event_score}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>Rank points</span>
                <span className="font-semibold">{team.rank_points}</span>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
