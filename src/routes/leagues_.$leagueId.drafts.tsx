import { createFileRoute } from "@tanstack/react-router";
import { LeagueDrafts } from "@/components/leagues/LeagueDrafts";
export const Route = createFileRoute("/leagues_/$leagueId/drafts")({
  head: () => ({ meta: [{ title: "Drafts · Fantasy FiM" }] }),
  component: LeagueView,
});
function LeagueView() {
  const { leagueId } = Route.useParams();
  return <LeagueDrafts key={leagueId} leagueId={leagueId} />;
}
