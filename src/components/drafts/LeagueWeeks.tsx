import { countTeamWeeks } from "@/lib/draft-calculations";
import type { DraftPick, FantasyTeam } from "@/api/drafts";
import { EmptyPanel } from "@/components/PageHeader";

export function LeagueWeeks({
  teams,
  picks,
  weeklyStarts,
}: {
  teams: FantasyTeam[];
  picks: DraftPick[];
  weeklyStarts: number;
}) {
  if (!teams.length) return <EmptyPanel label="No fantasy teams have joined this league yet." />;
  return (
    <section
      className="rounded-2xl border bg-card p-6 shadow-soft"
      aria-labelledby="league-weeks-title"
    >
      <h2 id="league-weeks-title" className="text-xl font-bold">
        League weeks
      </h2>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">
        Teams competing each week · {weeklyStarts} weekly starts needed. Weeks 5 and 6 are combined.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Fantasy team</th>
              {["1", "2", "3", "4", "5 + 6"].map((week) => (
                <th key={week} className="p-3">
                  Week {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.fantasy_team_id} className="border-b last:border-0">
                <th scope="row" className="p-3 text-left font-semibold">
                  {team.team_name}
                </th>
                {countTeamWeeks(team.fantasy_team_id, picks).map((count, index) => (
                  <td key={index} className="p-3 text-center">
                    <span
                      title={
                        count >= weeklyStarts
                          ? "Ready"
                          : count === weeklyStarts - 1
                            ? "One short"
                            : "Needs teams"
                      }
                      className={`inline-flex min-w-10 justify-center rounded-lg px-3 py-2 font-bold ${count >= weeklyStarts ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : count === weeklyStarts - 1 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-destructive/10 text-destructive"}`}
                    >
                      {count}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Green: ready · Amber: one short · Red: needs teams
      </p>
    </section>
  );
}
