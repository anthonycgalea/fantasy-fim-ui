import { createFileRoute } from "@tanstack/react-router";
import { LeagueScores } from "@/components/leagues/LeagueScores";
export const Route = createFileRoute("/leagues_/$leagueId/scores")({
  head: () => ({ meta: [{ title: "Scores / Lineups · Fantasy FiM" }] }),
  component: LeagueView,
});
function LeagueView() {
  const { leagueId } = Route.useParams();
  return <LeagueScores key={leagueId} leagueId={leagueId} />;
}
