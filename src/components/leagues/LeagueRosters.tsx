import { useState } from "react";
import { useLeague, useFantasyTeams } from "@/api/drafts";
import { useRosters, useRosterWeeks, type RosterWeek } from "@/api/leagues";
import { EmptyPanel } from "@/components/PageHeader";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";

const scheduleWeeks = [1, 2, 3, 4, 6, 7];
function RosterTeam({ teamKey, year }: { teamKey: string; year: number }) {
  const number = teamKey.replace(/^frc/, "");
  const [failedAvatar, setFailedAvatar] = useState(false);
  return (
    <a
      href={`https://www.thebluealliance.com/team/${number}/${year}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-24 items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3 transition hover:border-primary/50 hover:bg-accent/40"
    >
      <span className="text-xl font-extrabold text-primary">{number}</span>
      {!failedAvatar && (
        <img
          src={`https://www.thebluealliance.com/avatar/${year}/frc${number}.png`}
          alt=""
          loading="lazy"
          onError={() => setFailedAvatar(true)}
          className="h-7 w-7 rounded"
        />
      )}
    </a>
  );
}
function RosterSchedule({ roster, year }: { roster: RosterWeek | undefined; year: number }) {
  if (!roster?.roster.length)
    return <EmptyPanel label="No roster schedule is available for this fantasy team." />;
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-soft sm:p-6">
      <h3 className="mb-5 text-lg font-bold">{roster.fantasy_team_name} · Event schedule</h3>
      <div
        role="region"
        aria-label="Roster event schedule, scroll horizontally to see all weeks"
        tabIndex={0}
        className="overflow-x-auto"
      >
        <table className="w-full min-w-[740px] text-sm">
          <caption className="sr-only">{roster.fantasy_team_name} · Event schedule</caption>
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Team #</th>
              {scheduleWeeks.map((week) => (
                <th key={week} className="p-3 text-left">
                  Week {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.roster.map((team) => (
              <tr key={team.team_key} className="border-b last:border-0">
                <th scope="row" className="p-3 text-left">
                  <a
                    href={`https://www.thebluealliance.com/team/${team.team_key.replace(/^frc/, "")}/${year}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary hover:underline"
                  >
                    {team.team_key.replace(/^frc/, "")}
                  </a>
                </th>
                {scheduleWeeks.map((week) => {
                  const events = team.events.filter((event) => event.week === week);
                  return (
                    <td key={week} className="p-3 text-muted-foreground">
                      {events.length
                        ? events.map((event) => (
                            <a
                              key={event.event_key}
                              href={`https://www.thebluealliance.com/event/${event.event_key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={event.event_name}
                              className="block text-xs font-semibold text-primary hover:underline"
                            >
                              {event.event_key}
                            </a>
                          ))
                        : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export function LeagueRosters({ leagueId }: { leagueId: string }) {
  const league = useLeague(Number(leagueId));
  const teams = useFantasyTeams(Number(leagueId));
  const rosters = useRosters(leagueId);
  const weeks = useRosterWeeks(leagueId);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const queries = [league, teams, rosters, ...(selectedTeam === "all" ? [] : [weeks])];
  if (queries.some((query) => query.isError))
    return (
      <ErrorPanel
        label="Rosters couldn’t be loaded."
        retry={() => {
          queries.forEach((query) => {
            if (query.isError) void query.refetch();
          });
        }}
      />
    );
  if (!league.data || !teams.data || !rosters.data || (selectedTeam !== "all" && !weeks.data))
    return <LoadingPanel label="Loading rosters…" />;
  return (
    <section aria-labelledby="rosters-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="rosters-title" className="text-xl font-bold">
            Rosters
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse all rosters or choose a fantasy team to see its weekly event schedule.
          </p>
        </div>
        <label className="flex flex-col gap-2 text-xs font-semibold">
          Fantasy team
          <select
            aria-label="Fantasy team"
            value={selectedTeam}
            onChange={(event) => setSelectedTeam(event.target.value)}
            className="max-w-full rounded-xl border bg-card px-4 py-2 text-sm"
          >
            <option value="all">All Teams</option>
            {teams.data.map((team) => (
              <option key={team.fantasy_team_id} value={team.fantasy_team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedTeam === "all" ? (
        !rosters.data.length ? (
          <EmptyPanel label="No rosters are available for this league yet." />
        ) : (
          <div className="space-y-4">
            {rosters.data.map((roster) => (
              <section
                key={roster.fantasy_team_id}
                aria-label={roster.fantasy_team_name}
                className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{roster.fantasy_team_name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {roster.roster.length} teams
                  </span>
                </div>
                {roster.roster.length ? (
                  <div className="flex flex-wrap gap-3">
                    {roster.roster.map((team) => (
                      <RosterTeam key={team} teamKey={team} year={league.data.year} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">This roster is empty.</p>
                )}
              </section>
            ))}
          </div>
        )
      ) : (
        <RosterSchedule
          roster={weeks.data?.find((roster) => String(roster.fantasy_team_id) === selectedTeam)}
          year={league.data.year}
        />
      )}
    </section>
  );
}
