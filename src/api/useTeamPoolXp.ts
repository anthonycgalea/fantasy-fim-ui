import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./drafts";

type PoolTeam = { team_number: number; match13_xp?: number | null };

/** Older pool responses may omit XP; explicit null still means unavailable. */
export function useTeamPoolXp<T extends PoolTeam>(
  teams: T[] | undefined,
  year: number | undefined,
) {
  const missingNumbers = [
    ...new Set(
      (teams ?? []).filter((team) => team.match13_xp === undefined).map((team) => team.team_number),
    ),
  ].sort((a, b) => a - b);
  const xp = useQuery({
    queryKey: ["teamPoolXp", year, missingNumbers],
    enabled: year !== undefined && missingNumbers.length > 0,
    queryFn: ({ signal }) =>
      fetchApi<Record<string, number | null>>(
        `/xp?teams=${missingNumbers.join(",")}&year=${year}`,
        signal,
      ),
    staleTime: 60000,
  });
  return {
    teams: (teams ?? []).map((team) => ({
      ...team,
      match13_xp:
        team.match13_xp === undefined ? (xp.data?.[team.team_number] ?? null) : team.match13_xp,
    })),
    loading: missingNumbers.length > 0 && xp.isPending,
    xp,
  };
}
