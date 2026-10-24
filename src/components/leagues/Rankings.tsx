import { useRankings } from "@/api/leagues";
import { EmptyPanel } from "@/components/PageHeader";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";

export function Rankings({ leagueId }: { leagueId: string }) {
  const rankings = useRankings(leagueId);
  if (rankings.isError)
    return (
      <ErrorPanel
        label="Rankings couldn’t be loaded."
        retry={() => {
          void rankings.refetch();
        }}
        busy={rankings.isFetching}
      />
    );
  if (rankings.isPending) return <LoadingPanel label="Loading rankings…" />;
  if (!rankings.data.length)
    return <EmptyPanel label="Rankings aren’t available for this league yet." />;
  return (
    <section
      aria-labelledby="rankings-title"
      className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6"
    >
      <h2 id="rankings-title" className="text-xl font-bold">
        Rankings
      </h2>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">
        League standings by ranking points and tiebreaker.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="p-3 text-left">Rank</th>
              <th className="p-3 text-left">Team name</th>
              <th className="p-3 text-right">Ranking points</th>
              <th className="p-3 text-right">Tiebreaker</th>
            </tr>
          </thead>
          <tbody>
            {rankings.data.map((ranking, index) => (
              <tr
                key={ranking.fantasy_team_id}
                className="border-b last:border-0 hover:bg-muted/40"
              >
                <td className="p-3">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold ${index === 0 ? "bg-maize text-maize-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {index + 1}
                  </span>
                </td>
                <th scope="row" className="p-3 text-left font-semibold">
                  {ranking.fantasy_team_name}
                </th>
                <td className="p-3 text-right font-bold tabular-nums text-primary">
                  {ranking.total_ranking_points}
                </td>
                <td className="p-3 text-right tabular-nums text-muted-foreground">
                  {ranking.tiebreaker}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
