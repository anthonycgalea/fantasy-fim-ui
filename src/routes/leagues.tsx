import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyPanel } from "@/components/PageHeader";

export const Route = createFileRoute("/leagues")({
  head: () => ({
    meta: [
      { title: "Leagues · Fantasy FiM" },
      { name: "description", content: "Browse and join Fantasy FIRST in Michigan leagues." },
      { property: "og:title", content: "Leagues · Fantasy FiM" },
      { property: "og:description", content: "Browse and join Fantasy FIRST in Michigan leagues." },
    ],
  }),
  component: () => (
    <>
      <PageHeader kicker="// leagues" title="Leagues">Your leagues, drafts and rosters.</PageHeader>
      <EmptyPanel label="League list will load from the API" />
    </>
  ),
});
