import { createFileRoute } from "@tanstack/react-router";
import { LeagueRosters } from "@/components/leagues/LeagueRosters";
export const Route = createFileRoute("/leagues_/$leagueId/rosters")({
  head: () => ({ meta: [{ title: "Rosters · Fantasy FiM" }] }),
  component: LeagueView,
});
function LeagueView() {
  const { leagueId } = Route.useParams();
  return <LeagueRosters key={leagueId} leagueId={leagueId} />;
}
