import { createFileRoute } from "@tanstack/react-router";
import { parseRefreshInterval } from "@/api/drafts";
import { DraftPage } from "@/components/drafts/DraftPage";

export const Route = createFileRoute("/drafts/$draftId")({
  head: () => ({ meta: [{ title: "Draft · Fantasy FiM" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    autoRefreshInterval: parseRefreshInterval(search["autoRefreshInterval"] ?? 15000),
  }),
  component: DraftRoute,
});
function DraftRoute() {
  const { draftId } = Route.useParams();
  const { autoRefreshInterval } = Route.useSearch();
  return <DraftPage key={draftId} draftId={draftId} interval={autoRefreshInterval} />;
}
