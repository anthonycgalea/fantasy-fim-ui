import { createFileRoute } from "@tanstack/react-router";
import { DraftPage } from "@/components/drafts/DraftPage";
export const Route = createFileRoute("/drafts_/$draftId/leagueWeeks")({
  component: LeagueWeeksRoute,
});
function LeagueWeeksRoute() {
  const { draftId } = Route.useParams();
  return <DraftPage key={draftId} draftId={draftId} initialTab="leagueWeeks" />;
}
