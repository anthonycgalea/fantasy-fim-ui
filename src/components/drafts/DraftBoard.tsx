import { buildDraftRows } from "@/lib/draft-calculations";
import { useQuery } from "@tanstack/react-query";
import { fetchApi, type DraftPick, type DraftSlot, type FantasyTeam } from "@/api/drafts";
import { EmptyPanel } from "@/components/PageHeader";
import { TeamCard } from "./TeamCard";

export function DraftBoard({
  order,
  picks,
  teams,
  rounds,
  year,
  epaYear,
  offseason = false,
}: {
  order: DraftSlot[];
  picks: DraftPick[];
  teams: FantasyTeam[];
  rounds: number;
  year: number;
  epaYear: number;
  offseason?: boolean;
}) {
  const sortedOrder = [...order].sort((a, b) => a.draft_slot - b.draft_slot);
  const pickedNumbers = [
    ...new Set(picks.map((pick) => pick.team_picked).filter((team) => /^\d+$/.test(team))),
  ].sort();
  const epa = useQuery({
    queryKey: ["draftEpa", epaYear, pickedNumbers],
    enabled: pickedNumbers.length > 0,
    queryFn: ({ signal }) =>
      fetchApi<Record<string, number | null>>(
        `/epa?teams=${pickedNumbers.join(",")}&year=${epaYear}`,
        signal,
      ),
    staleTime: 86400000,
  });
  if (!order.length) return <EmptyPanel label="The draft order hasn’t been set yet." />;
  if (rounds < 1) return <EmptyPanel label="No draft rounds have been set yet." />;
  const rows = buildDraftRows(sortedOrder, picks, rounds);
  const filled = new Set(
    picks.filter((pick) => /^\d+$/.test(pick.team_picked)).map((pick) => pick.pick_number),
  );
  const nextPick = Array.from({ length: order.length * rounds }, (_, i) => i + 1).find(
    (number) => !filled.has(number),
  );
  return (
    <section
      aria-labelledby="draft-board-title"
      className="rounded-2xl border bg-card p-4 shadow-soft sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 id="draft-board-title" className="text-xl font-bold">
          Draft board
        </h2>
        <span className="text-xs text-muted-foreground">
          Snake draft · {rounds} rounds · {filled.size} picks
        </span>
      </div>
      <div
        role="region"
        aria-label="Draft board, scroll horizontally to see all teams"
        tabIndex={0}
        className="overflow-x-auto pb-2"
      >
        <table
          className="w-full table-fixed border-separate border-spacing-2"
          style={{ minWidth: sortedOrder.length * 176 + 72 }}
        >
          <thead>
            <tr>
              <th className="w-16 text-left text-xs text-muted-foreground">Round</th>
              {sortedOrder.map((slot) => (
                <th
                  key={slot.fantasy_team_id}
                  scope="col"
                  className="pb-2 text-center text-sm font-bold"
                >
                  {teams.find((team) => team.fantasy_team_id === slot.fantasy_team_id)?.team_name ??
                    `Team ${slot.fantasy_team_id}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <th scope="row" className="align-top pt-4 text-left">
                  <span className="text-xl font-extrabold">{index + 1}</span>
                  <span className="block text-xs text-muted-foreground">
                    {index % 2 ? "←" : "→"}
                  </span>
                </th>
                {row.map(({ pickNumber, pick }) => (
                  <td key={pickNumber} data-pick={pickNumber} className="align-top">
                    {pick && filled.has(pickNumber) ? (
                      <TeamCard
                        number={pick.team_picked}
                        events={pick.events ?? []}
                        epa={epa.data?.[pick.team_picked]}
                        year={year}
                        pickNumber={pickNumber}
                        hideEmptyWeeks={offseason}
                        compact={offseason}
                      />
                    ) : (
                      <div
                        aria-current={pickNumber === nextPick ? "step" : undefined}
                        className={`relative flex flex-col justify-end border ${offseason ? "min-h-24 rounded-lg p-2.5" : "min-h-36 rounded-xl p-4"} ${pickNumber === nextPick ? "border-yellow-500 bg-yellow-100 text-yellow-950 dark:border-yellow-400 dark:bg-yellow-950 dark:text-yellow-100" : "border-dashed bg-muted/30"}`}
                      >
                        <span
                          className={`absolute text-xs font-semibold text-muted-foreground ${offseason ? "right-2.5 top-2.5" : "right-3 top-3"}`}
                        >
                          {pickNumber}
                        </span>
                        {pickNumber === nextPick && (
                          <span className="text-sm font-semibold">Picking</span>
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
