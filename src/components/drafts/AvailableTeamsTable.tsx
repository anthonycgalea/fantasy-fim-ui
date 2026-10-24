import { useState } from "react";
import type { AvailableTeam } from "@/api/drafts";

const weeks = [1, 2, 3, 4, 5, 6];
function TeamIcon({ number, year }: { number: number; year: number }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span aria-hidden="true" className="inline-block h-8 w-8" />
  ) : (
    <img
      src={`https://www.thebluealliance.com/avatar/${year}/frc${number}.png`}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-8 w-8 rounded-md"
    />
  );
}

export function AvailableTeamsTable({
  teams,
  leagueYear,
}: {
  teams: AvailableTeam[];
  leagueYear: number;
}) {
  return (
    <div
      role="region"
      aria-label="Available teams, scroll horizontally to see all weeks"
      tabIndex={0}
      className="overflow-x-auto rounded-2xl border bg-card shadow-soft"
    >
      <table aria-labelledby="available-teams-title" className="w-full min-w-[1000px] text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b text-left text-xs font-semibold text-muted-foreground">
            <th scope="col" className="px-4 py-4">
              Team Number
            </th>
            <th scope="col" className="px-4 py-4">
              Team Name
            </th>
            <th scope="col" aria-label="Team icon" className="w-16 px-4 py-4" />
            <th scope="col" className="whitespace-nowrap px-4 py-4 text-right">
              {leagueYear - 1} XP
            </th>
            {weeks.map((week) => (
              <th key={week} scope="col" className="whitespace-nowrap px-4 py-4">
                Week {week}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.team_number} className="border-b last:border-0 hover:bg-accent/30">
              <th scope="row" className="px-4 py-3 text-left">
                <a
                  href={`https://www.thebluealliance.com/team/${team.team_number}/${leagueYear}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  {team.team_number}
                </a>
              </th>
              <td className="min-w-48 px-4 py-3 font-semibold">{team.name}</td>
              <td className="px-4 py-3">
                <TeamIcon number={team.team_number} year={leagueYear} />
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">
                {team.year_end_epa ?? "N/A"}
              </td>
              {weeks.map((week) => {
                const events = team.events.filter((event) => event.week === week);
                return (
                  <td key={week} className="px-4 py-3 text-muted-foreground">
                    {events.length ? (
                      <div className="flex flex-col gap-1">
                        {events.map((event) => (
                          <a
                            key={event.event_key}
                            href={`https://www.thebluealliance.com/event/${encodeURIComponent(event.event_key)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:underline"
                          >
                            {event.event_key.replace(/^\d{4}/, "")}
                          </a>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
