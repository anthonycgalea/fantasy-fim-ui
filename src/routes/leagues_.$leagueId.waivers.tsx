import { createFileRoute } from "@tanstack/react-router";
import { LeagueWaivers } from "@/components/leagues/LeagueWaivers";
export const Route = createFileRoute("/leagues_/$leagueId/waivers")({
  head: () => ({ meta: [{ title: "Waivers · Fantasy FiM" }] }),
  component: LeagueView,
});
function LeagueView() {
  const { leagueId } = Route.useParams();
  return <LeagueWaivers key={leagueId} leagueId={leagueId} />;
}
