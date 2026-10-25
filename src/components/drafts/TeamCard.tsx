import { useState } from "react";
import type { TeamEvent } from "@/api/drafts";

export function TeamCard({
  number,
  name,
  events,
  epa,
  year,
  avatarYear = year,
  pickNumber,
  hideEmptyWeeks = false,
  compact = false,
}: {
  number: string | number;
  name?: string;
  events: TeamEvent[];
  epa: number | null | undefined;
  year: number;
  avatarYear?: number;
  pickNumber?: number;
  hideEmptyWeeks?: boolean;
  compact?: boolean;
}) {
  const [failedAvatar, setFailedAvatar] = useState(false);
  const weeks = events
    .filter((event) => event.week !== 99)
    .map((event) => event.week)
    .sort((a, b) => a - b);
  return (
    <a
      href={`https://www.thebluealliance.com/team/${number}/${year}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col border bg-card shadow-soft transition hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-ring ${compact ? "min-h-24 rounded-lg p-2.5" : "min-h-36 rounded-xl p-4"}`}
    >
      {pickNumber !== undefined && (
        <span
          className={`absolute text-xs font-semibold text-muted-foreground ${compact ? "right-2.5 top-2.5" : "right-3 top-3"}`}
        >
          {pickNumber}
        </span>
      )}
      <div
        className={`flex items-start justify-between gap-2 ${pickNumber !== undefined ? "pr-8" : ""}`}
      >
        <span
          className={`${compact ? "text-xl" : "text-2xl"} font-extrabold tracking-tight text-primary`}
        >
          {number}
        </span>
        {!failedAvatar && (
          <img
            src={`https://www.thebluealliance.com/avatar/${avatarYear}/frc${number}.png`}
            alt=""
            loading="lazy"
            onError={() => setFailedAvatar(true)}
            className={`rounded-md ${compact ? "h-6 w-6" : "h-8 w-8"} ${pickNumber !== undefined ? (compact ? "absolute bottom-2.5 right-2.5" : "absolute bottom-3 right-3") : ""}`}
          />
        )}
      </div>
      {name && (
        <span className="mt-1 truncate text-sm font-semibold" title={name}>
          {name}
        </span>
      )}
      {(weeks.length > 0 || !hideEmptyWeeks) && (
        <span className={`${compact ? "mt-1" : "mt-2"} text-xs text-muted-foreground`}>
          {weeks.length ? `Weeks ${weeks.join(", ")}` : "No scheduled weeks"}
        </span>
      )}
      <span
        className={`mt-auto text-xs font-semibold ${compact ? "pt-1" : "pt-2"} ${pickNumber !== undefined ? (compact ? "pr-8" : "pr-10") : ""}`}
      >
        EPA <span className="text-muted-foreground">{epa ?? "N/A"}</span>
      </span>
    </a>
  );
}
