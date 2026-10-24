import type { EventData, EpaField } from "@/api/useEventData";

export function getEpaRanges(events: EventData[]) {
  const fields: EpaField[] = ["maxepa", "top8epa", "top24epa", "avgepa", "medianepa"];
  return Object.fromEntries(
    fields.map((field) => {
      const values = events
        .map((event) => event[field])
        .filter((value): value is number => value !== null && Number.isFinite(value));
      return [field, values.length ? { min: Math.min(...values), max: Math.max(...values) } : null];
    }),
  ) as Record<EpaField, { min: number; max: number } | null>;
}

export function getDifficultyHue(value: number, range: { min: number; max: number }) {
  const ratio =
    range.max === range.min
      ? 0.5
      : Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
  return ratio < 0.5 ? 140 - 190 * ratio : 90 - 90 * ratio;
}

export function sortEvents(
  events: EventData[],
  key: keyof EventData,
  direction: "ascending" | "descending",
) {
  return [...events].sort((a, b) => {
    const left = a[key],
      right = b[key];
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    const comparison =
      typeof left === "string" && typeof right === "string"
        ? left.localeCompare(right)
        : Number(left) - Number(right);
    return direction === "ascending" ? comparison : -comparison;
  });
}
