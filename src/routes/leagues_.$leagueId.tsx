import { createFileRoute } from "@tanstack/react-router";
import { LeagueLayout } from "@/components/leagues/LeagueLayout";

export const Route = createFileRoute("/leagues_/$leagueId")({
  head: () => ({ meta: [{ title: "League · Fantasy FiM" }] }),
  component: LeagueRoute,
});
function LeagueRoute() {
  const { leagueId } = Route.useParams();
  return <LeagueLayout leagueId={leagueId} />;
}
