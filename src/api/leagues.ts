import { useQuery } from "@tanstack/react-query";
import { fetchApi, type AvailableTeam, type ScoreBreakdown } from "./drafts";

export type Ranking = {
  fantasy_team_id: number;
  fantasy_team_name: string;
  total_ranking_points: number;
  tiebreaker: number;
};
export type Lineup = {
  fantasy_team_id: number;
  fantasy_team_name: string;
  teams: { team_number: string }[];
};
export type WeeklyLineup = { week: number; fantasy_teams: Lineup[] };
export type WeeklyScore = {
  fantasy_team_id: number;
  fantasy_team_name: string;
  weekly_score: number;
  rank_points: number;
  teams: { team_number: string; weekly_score: number; breakdown?: ScoreBreakdown }[];
};
export type Roster = { fantasy_team_id: number; fantasy_team_name: string; roster: string[] };
export type RosterWeek = {
  fantasy_team_id: number;
  fantasy_team_name: string;
  roster: { team_key: string; events: { event_key: string; event_name: string; week: number }[] }[];
};
export type WaiverPriority = {
  fantasy_team_id: number;
  fantasy_team_name: string;
  priority: number;
};
export type WaiverTeam = Omit<AvailableTeam, "year_end_epa"> & { year_end_epa?: number | null };

function useLeagueList<T>(leagueId: string, resource: string, key: string) {
  return useQuery({
    queryKey: [key, leagueId],
    queryFn: ({ signal }) =>
      fetchApi<T[]>(`/leagues/${encodeURIComponent(leagueId)}/${resource}`, signal),
  });
}
export const useRankings = (leagueId: string) =>
  useLeagueList<Ranking>(leagueId, "rankings", "leagueRankings");
export const useLineups = (leagueId: string) =>
  useLeagueList<WeeklyLineup>(leagueId, "lineups", "leagueLineups");
export const useRosters = (leagueId: string) =>
  useLeagueList<Roster>(leagueId, "rosters", "leagueRosters");
export const useRosterWeeks = (leagueId: string) =>
  useLeagueList<RosterWeek>(leagueId, "rosterWeeks", "rosterWeeks");
export const useLeagueTeamPool = (leagueId: string, waiver: boolean) =>
  useLeagueList<WaiverTeam>(
    leagueId,
    waiver ? "teamsOnWaivers" : "availableTeams",
    waiver ? "waiverTeams" : "leagueAvailableTeams",
  );
export const useWaiverPriority = (leagueId: string) =>
  useLeagueList<WaiverPriority>(leagueId, "waiverPriority", "waiverPriority");
export function useLeagueScores(leagueId: string, week: number | undefined) {
  return useQuery({
    queryKey: ["scores", leagueId, week],
    enabled: week !== undefined,
    queryFn: ({ signal }) =>
      fetchApi<WeeklyScore[]>(
        `/leagues/${encodeURIComponent(leagueId)}/fantasyScores/${week}`,
        signal,
      ),
  });
}
