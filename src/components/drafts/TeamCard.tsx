import { useState } from "react";
import type { TeamEvent } from "@/api/drafts";

export function TeamCard({
  number,
  name,
  events,
  epa,
  year,
  avatarYear = year,
  caption,
}: {
  number: string | number;
  name?: string;
  events: TeamEvent[];
  epa: number | null | undefined;
  year: number;
  avatarYear?: number;
  caption?: string;
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
      className="group relative flex min-h-36 flex-col rounded-xl border bg-card p-4 shadow-soft transition hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {caption && (
        <span className="mb-2 text-xs font-semibold text-muted-foreground">{caption}</span>
      )}
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-primary">{number}</span>
        {!failedAvatar && (
          <img
            src={`https://www.thebluealliance.com/avatar/${avatarYear}/frc${number}.png`}
            alt=""
            loading="lazy"
            onError={() => setFailedAvatar(true)}
            className="h-8 w-8 rounded-md"
          />
        )}
      </div>
      {name && (
        <span className="mt-1 truncate text-sm font-semibold" title={name}>
          {name}
        </span>
      )}
      <span className="mt-2 text-xs text-muted-foreground">
        {weeks.length ? `Weeks ${weeks.join(", ")}` : "No scheduled weeks"}
      </span>
      <span className="mt-auto pt-2 text-xs font-semibold">
        EPA <span className="text-muted-foreground">{epa ?? "N/A"}</span>
      </span>
    </a>
  );
}
