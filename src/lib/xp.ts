/** Normalized match13 XP: higher is better; missing values stay last. */
export function formatXp(value: number | null | undefined): string {
  return value == null ? "—" : String(Math.round(value));
}

export function compareXpDescending(
  left: number | null | undefined,
  right: number | null | undefined,
): number {
  if (left == null) return right == null ? 0 : 1;
  if (right == null) return -1;
  return right - left;
}
