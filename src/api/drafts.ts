import { useQuery } from "@tanstack/react-query";
import type { League } from "./useLeagues";

export type Draft = { draft_id: number; event_key: string; league_id: number; rounds: number };
export type TeamEvent = { event_key: string; week: number };
export type DraftPick = {
  events: TeamEvent[];
  fantasy_team_id: number;
  pick_number: number;
  team_picked: string;
};
export type DraftSlot = { draft_slot: number; fantasy_team_id: number };
export type FantasyTeam = { fantasy_team_id: number; team_name: string };
export type AvailableTeam = {
  team_number: number;
  name: string;
  events: TeamEvent[];
  year_end_epa: number | null;
};
export type WeekStatus = { year: number; week: number };
export type ScoreBreakdown = {
  qual_points: number;
  alliance_points: number;
  elim_points: number;
  award_points: number;
  rookie_points: number;
  stat_correction: number;
};
export type TeamScore = { team_number: string; event_score: number; breakdown?: ScoreBreakdown };
export type DraftScore = {
  fantasy_team_id: number;
  fantasy_team_name: string;
  event_score: number;
  rank_points: number;
  teams: TeamScore[];
};

export async function fetchApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  const base = (
    import.meta.env["VITE_API_BASE_URL"] ??
    (import.meta.env.DEV ? "/api" : "https://fantasyfim.com/api")
  ).replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, { signal: signal ?? null });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function useDraft(draftId: string) {
  return useQuery({
    queryKey: ["draft", draftId],
    queryFn: ({ signal }) => fetchApi<Draft>(`/drafts/${encodeURIComponent(draftId)}`, signal),
  });
}
export function useLeague(leagueId: number | undefined) {
  return useQuery({
    queryKey: ["leagueData", leagueId],
    enabled: leagueId !== undefined,
    queryFn: ({ signal }) => fetchApi<League>(`/leagues/${leagueId}`, signal),
  });
}
export function useLeagueDrafts(leagueId: string) {
  return useQuery({
    queryKey: ["leagueDrafts", leagueId],
    queryFn: ({ signal }) =>
      fetchApi<Draft[]>(`/leagues/${encodeURIComponent(leagueId)}/drafts`, signal),
  });
}
export function useDraftPicks(draftId: string, interval: number | false = false) {
  return useQuery({
    queryKey: ["draftPicks", draftId],
    queryFn: ({ signal }) =>
      fetchApi<DraftPick[]>(`/drafts/${encodeURIComponent(draftId)}/picks`, signal),
    refetchInterval: interval,
  });
}
export function useDraftOrder(draftId: string) {
  return useQuery({
    queryKey: ["draftOrder", draftId],
    queryFn: ({ signal }) =>
      fetchApi<DraftSlot[]>(`/drafts/${encodeURIComponent(draftId)}/draftOrder`, signal),
  });
}
export function useFantasyTeams(leagueId: number | undefined) {
  return useQuery({
    queryKey: ["fantasyTeams", leagueId],
    enabled: leagueId !== undefined,
    queryFn: ({ signal }) => fetchApi<FantasyTeam[]>(`/leagues/${leagueId}/fantasyTeams`, signal),
  });
}
export function useAvailableTeams(draftId: string, interval: number | false = false) {
  return useQuery({
    queryKey: ["availableTeams", draftId],
    queryFn: ({ signal }) =>
      fetchApi<AvailableTeam[]>(`/drafts/${encodeURIComponent(draftId)}/availableTeams`, signal),
    refetchInterval: interval,
  });
}
export function useCurrentWeek() {
  return useQuery({
    queryKey: ["currentWeek"],
    queryFn: ({ signal }) => fetchApi<WeekStatus>("/currentWeek", signal),
  });
}
export function useDraftScores(draftId: string) {
  return useQuery({
    queryKey: ["draftScores", draftId],
    queryFn: ({ signal }) =>
      fetchApi<DraftScore[]>(`/drafts/${encodeURIComponent(draftId)}/fantasyScores`, signal),
  });
}

export function getEpaYear(league: League, currentWeek?: WeekStatus) {
  if (league.offseason) return league.year;
  return currentWeek?.year === league.year && currentWeek.week !== 1
    ? league.year
    : league.year - 1;
}
export function parseRefreshInterval(value: unknown): number | false {
  if (typeof value !== "number" && typeof value !== "string") return false;
  const interval = Number(value);
  return Number.isFinite(interval) && interval >= 1000 ? interval : false;
}
