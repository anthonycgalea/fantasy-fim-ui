import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyPanel } from "@/components/PageHeader";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams · Fantasy FiM" },
      { name: "description", content: "Scout Michigan FRC teams and their fantasy scores." },
      { property: "og:title", content: "Teams · Fantasy FiM" },
      { property: "og:description", content: "Scout Michigan FRC teams and their fantasy scores." },
    ],
  }),
  component: () => (
    <>
      <PageHeader kicker="// scouting" title="Teams">Every FiM team, ranked by fantasy points.</PageHeader>
      <EmptyPanel label="Team table will load from the API" />
    </>
  ),
});
