import { useQuery } from "@tanstack/react-query";

export type League = {
  league_id: number;
  league_name: string;
  is_fim: boolean;
  year: number;
  offseason?: boolean;
  weekly_starts: number;
  team_limit: number;
  team_starts: number;
  team_size_limit: number;
};

export async function fetchLeagues(signal?: AbortSignal): Promise<League[]> {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "/api" : "https://www.fantasyfim.com/api")).replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/leagues`, { signal });
  if (!response.ok) {
    throw new Error(`Unable to load leagues (${response.status})`);
  }
  const leagues: unknown = await response.json();
  if (!Array.isArray(leagues) || !leagues.every((league) =>
    league && typeof league.league_id === "number" &&
    typeof league.league_name === "string" && typeof league.is_fim === "boolean"
  )) {
    throw new Error("The API returned an invalid league list");
  }
  return leagues as League[];
}

export const useLeagues = () => useQuery({
  queryKey: ["leagues"],
  queryFn: ({ signal }) => fetchLeagues(signal),
});
