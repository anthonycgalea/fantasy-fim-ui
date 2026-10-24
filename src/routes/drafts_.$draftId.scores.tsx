import { createFileRoute } from "@tanstack/react-router";
import { DraftScores } from "@/components/drafts/DraftScores";
export const Route = createFileRoute("/drafts_/$draftId/scores")({
  head: () => ({ meta: [{ title: "Draft Scores · Fantasy FiM" }] }),
  component: ScoresRoute,
});
function ScoresRoute() {
  const { draftId } = Route.useParams();
  return <DraftScores draftId={draftId} />;
}
