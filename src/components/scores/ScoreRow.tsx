import type { ScoreBreakdown } from "@/api/drafts";
const breakdownLabels = {
  qual_points: "Qual",
  alliance_points: "Alliance",
  elim_points: "Elim",
  award_points: "Award",
  rookie_points: "Rookie",
  stat_correction: "Stat Corr",
} as const;
export function ScoreRow({
  teamNumber,
  score,
  breakdown,
}: {
  teamNumber: string | undefined;
  score: number | undefined;
  breakdown: ScoreBreakdown | undefined;
}) {
  if (!teamNumber)
    return (
      <div className="flex justify-between border-b py-3 text-sm">
        <span className="text-muted-foreground">Unfilled start</span>
        <span>0</span>
      </div>
    );
  const row = (
    <span className="flex flex-1 justify-between gap-4">
      <span className="font-semibold">{teamNumber}</span>
      <span className="tabular-nums">{score ?? "—"}</span>
    </span>
  );
  return breakdown ? (
    <details className="border-b py-3 text-sm">
      <summary className="flex cursor-pointer items-center gap-2">
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          ▸
        </span>
        {row}
      </summary>
      <dl className="mt-3 space-y-2 rounded-xl bg-muted/60 p-3 text-xs">
        {(Object.keys(breakdownLabels) as (keyof typeof breakdownLabels)[]).map((key) => (
          <div key={key} className="flex justify-between">
            <dt>{breakdownLabels[key]}</dt>
            <dd>{breakdown[key] ?? 0}</dd>
          </div>
        ))}
      </dl>
    </details>
  ) : (
    <div className="flex border-b py-3 text-sm">{row}</div>
  );
}
