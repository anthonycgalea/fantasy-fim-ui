import type { DraftPick, DraftSlot } from "@/api/drafts";

export function buildDraftRows(order: DraftSlot[], picks: DraftPick[], rounds: number) {
  const byNumber = new Map(picks.map((pick) => [pick.pick_number, pick]));
  return Array.from({ length: Math.max(0, rounds) }, (_, round) =>
    order.map((_, column) => {
      const pickNumber =
        round * order.length + (round % 2 === 0 ? column + 1 : order.length - column);
      return { pickNumber, pick: byNumber.get(pickNumber) };
    }),
  );
}

export function countTeamWeeks(teamId: number, picks: DraftPick[]) {
  const counts = [0, 0, 0, 0, 0, 0];
  for (const pick of picks) {
    if (pick.fantasy_team_id !== teamId || pick.team_picked === "-1") continue;
    for (const event of pick.events ?? []) {
      if (event.week >= 1 && event.week <= 6)
        counts[event.week - 1] = (counts[event.week - 1] ?? 0) + 1;
    }
  }
  return [
    counts[0] ?? 0,
    counts[1] ?? 0,
    counts[2] ?? 0,
    counts[3] ?? 0,
    (counts[4] ?? 0) + (counts[5] ?? 0),
  ];
}
