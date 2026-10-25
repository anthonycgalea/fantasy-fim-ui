import { useTeamPoolXp } from "@/api/useTeamPoolXp";
import { compareXpDescending } from "@/lib/xp";
import { useState } from "react";
import { getXpYear, useLeague, useCurrentWeek } from "@/api/drafts";
import { useLeagueTeamPool } from "@/api/leagues";
import { EmptyPanel } from "@/components/PageHeader";
import { TeamCard } from "@/components/drafts/TeamCard";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";

const weekOptions = [1, 2, 3, 4, 6];
export function LeagueTeamPool({
  leagueId,
  waiver = false,
}: {
  leagueId: string;
  waiver?: boolean;
}) {
  const league = useLeague(Number(leagueId));
  const pool = useLeagueTeamPool(leagueId, waiver);
  const currentWeek = useCurrentWeek();
  const xpYear = league.data ? getXpYear(league.data, currentWeek.data) : undefined;
  const poolXp = useTeamPoolXp(pool.data, xpYear);
  const [selectedWeeks, setSelectedWeeks] = useState(weekOptions);
  const [search, setSearch] = useState("");
  const title = waiver ? "Teams on waivers" : "Available teams";
  const queries = [league, pool];
  if (queries.some((query) => query.isError))
    return (
      <ErrorPanel
        label={`${title} couldn’t be loaded.`}
        retry={() => {
          queries.forEach((query) => {
            if (query.isError) void query.refetch();
          });
        }}
      />
    );
  if (!league.data || !pool.data) return <LoadingPanel label={`Loading ${title.toLowerCase()}…`} />;
  const teams = [...poolXp.teams]
    .sort((a, b) => compareXpDescending(a.match13_xp, b.match13_xp))
    .filter(
      (team) =>
        (!league.data.is_fim || team.events.some((event) => selectedWeeks.includes(event.week))) &&
        `${team.team_number} ${team.name}`.toLowerCase().includes(search.trim().toLowerCase()),
    );
  return (
    <section aria-labelledby={waiver ? "waiver-teams-title" : "league-available-title"}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id={waiver ? "waiver-teams-title" : "league-available-title"}
            className="text-xl font-bold"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Highest XP first · {teams.length} teams
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
      {poolXp.loading && (
        <p role="status" className="mb-3 text-sm text-muted-foreground">
          Loading XP…
        </p>
      )}
      {poolXp.xp.isError && (
        <ErrorPanel
          label="XP couldn’t be loaded."
          retry={() => {
            void poolXp.xp.refetch();
          }}
          busy={poolXp.xp.isFetching}
        />
      )}
      {league.data.is_fim && (
        <fieldset className="mb-5 flex flex-wrap gap-2">
          <legend className="mb-2 text-xs font-semibold text-muted-foreground">
            Competes in week
          </legend>
          {weekOptions.map((week) => (
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
      {!teams.length ? (
        <EmptyPanel
          label={
            pool.data.length
              ? "No teams match your filters."
              : waiver
                ? "No teams are on waivers."
                : "No teams are available in this league."
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
              xp={team.match13_xp ?? null}
              year={xpYear ?? league.data.year}
            />
          ))}
        </div>
      )}
    </section>
  );
}
