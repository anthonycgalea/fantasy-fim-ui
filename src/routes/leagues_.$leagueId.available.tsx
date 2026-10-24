import { createFileRoute } from "@tanstack/react-router";
import { LeagueTeamPool } from "@/components/leagues/LeagueTeamPool";
export const Route = createFileRoute("/leagues_/$leagueId/available")({
  head: () => ({ meta: [{ title: "Available Teams · Fantasy FiM" }] }),
  component: LeagueView,
});
function LeagueView() {
  const { leagueId } = Route.useParams();
  return <LeagueTeamPool key={leagueId} leagueId={leagueId} />;
}
