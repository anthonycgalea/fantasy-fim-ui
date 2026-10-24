import { useState } from "react";
import { useAvailableTeams } from "@/api/drafts";
import { EmptyPanel } from "@/components/PageHeader";
import { TeamCard } from "./TeamCard";
import { ErrorPanel, LoadingPanel } from "./QueryPanel";

const weeks = [1, 2, 3, 4, 5, 6];
export function AvailableTeams({
  draftId,
  isFim,
  epaYear,
  interval,
}: {
  draftId: string;
  isFim: boolean;
  epaYear: number;
  interval: number | false;
}) {
  const available = useAvailableTeams(draftId, interval);
  const [selectedWeeks, setSelectedWeeks] = useState(weeks);
  const [search, setSearch] = useState("");
  const teams = [...(available.data ?? [])]
    .sort((a, b) => (b.year_end_epa ?? -Infinity) - (a.year_end_epa ?? -Infinity))
    .filter(
      (team) =>
        (!isFim || team.events.some((event) => selectedWeeks.includes(event.week))) &&
        `${team.team_number} ${team.name}`.toLowerCase().includes(search.trim().toLowerCase()),
    );
  return (
    <section aria-labelledby="available-teams-title" className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="available-teams-title" className="text-2xl font-bold">
            Available teams
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Highest EPA first{available.data ? ` · ${teams.length} teams` : ""}
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Find a team
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Team number or name"
            className="w-64 max-w-full rounded-xl border bg-card px-4 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
      {isFim && (
        <fieldset className="mb-5 flex flex-wrap gap-2">
          <legend className="mb-2 text-xs font-semibold text-muted-foreground">
            Competes in week
          </legend>
          {weeks.map((week) => (
            <label
              key={week}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${selectedWeeks.includes(week) ? "border-primary/30 bg-accent text-accent-foreground" : "bg-card text-muted-foreground"}`}
            >
              <input
                type="checkbox"
                checked={selectedWeeks.includes(week)}
                onChange={() =>
                  setSelectedWeeks((previous) =>
                    previous.includes(week)
                      ? previous.filter((value) => value !== week)
                      : [...previous, week],
                  )
                }
                className="accent-primary"
              />
              Week {week}
            </label>
          ))}
        </fieldset>
      )}
      {available.isPending ? (
        <LoadingPanel label="Loading available teams…" />
      ) : available.isError ? (
        <ErrorPanel
          label="Available teams couldn’t be loaded."
          retry={() => {
            void available.refetch();
          }}
          busy={available.isFetching}
        />
      ) : teams.length === 0 ? (
        <EmptyPanel
          label={
            available.data.length
              ? "No teams match your filters."
              : "No teams are available for this draft."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {teams.map((team) => (
            <TeamCard
              key={team.team_number}
              number={team.team_number}
              name={team.name}
              events={team.events}
              epa={team.year_end_epa}
              year={epaYear}
            />
          ))}
        </div>
      )}
    </section>
  );
}
