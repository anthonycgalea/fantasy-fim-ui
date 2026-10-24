import { createFileRoute } from "@tanstack/react-router";
import { Rankings } from "@/components/leagues/Rankings";
export const Route = createFileRoute("/leagues_/$leagueId/rankings")({
  head: () => ({ meta: [{ title: "Rankings · Fantasy FiM" }] }),
  component: LeagueView,
});
function LeagueView() {
  const { leagueId } = Route.useParams();
  return <Rankings key={leagueId} leagueId={leagueId} />;
}
