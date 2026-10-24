import { useState } from "react";
import { useWaiverPriority } from "@/api/leagues";
import { EmptyPanel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";
import { LeagueTeamPool } from "./LeagueTeamPool";

function PriorityTable({ leagueId }: { leagueId: string }) {
  const priority = useWaiverPriority(leagueId);
  if (priority.isError)
    return (
      <ErrorPanel
        label="Waiver priority couldn’t be loaded."
        retry={() => {
          void priority.refetch();
        }}
        busy={priority.isFetching}
      />
    );
  if (priority.isPending) return <LoadingPanel label="Loading waiver priority…" />;
  if (!priority.data.length) return <EmptyPanel label="Waiver priority hasn’t been set yet." />;
  return (
    <section
      aria-labelledby="waiver-priority-title"
      className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6"
    >
      <h2 id="waiver-priority-title" className="mb-5 text-xl font-bold">
        Waiver priority
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="p-3 text-left">Priority</th>
              <th className="p-3 text-left">Fantasy team</th>
            </tr>
          </thead>
          <tbody>
            {priority.data.map((team) => (
              <tr key={team.fantasy_team_id} className="border-b last:border-0">
                <td className="p-3 font-bold text-primary">{team.priority}</td>
                <th scope="row" className="p-3 text-left font-semibold">
                  {team.fantasy_team_name}
                </th>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export function LeagueWaivers({ leagueId }: { leagueId: string }) {
  const [tab, setTab] = useState<"teams" | "priority">("teams");
  return (
    <>
      <div role="group" aria-label="Waiver views" className="mb-5 flex flex-wrap gap-2">
        <Button
          variant={tab === "teams" ? "default" : "outline"}
          aria-pressed={tab === "teams"}
          onClick={() => setTab("teams")}
        >
          Teams on Waivers
        </Button>
        <Button
          variant={tab === "priority" ? "default" : "outline"}
          aria-pressed={tab === "priority"}
          onClick={() => setTab("priority")}
        >
          Waiver Priority
        </Button>
      </div>
      {tab === "teams" ? (
        <LeagueTeamPool leagueId={leagueId} waiver />
      ) : (
        <PriorityTable leagueId={leagueId} />
      )}
    </>
  );
}
