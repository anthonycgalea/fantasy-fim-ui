import { createFileRoute } from "@tanstack/react-router";
import { LeagueSelection } from "@/components/LeagueSelection";

export const Route = createFileRoute("/offseasons")({
  head: () => ({
    meta: [
      { title: "Offseasons · Fantasy FiM" },
      { name: "description", content: "Browse Fantasy FIRST in Michigan offseason leagues." },
      { property: "og:title", content: "Offseasons · Fantasy FiM" },
      {
        property: "og:description",
        content: "Browse Fantasy FIRST in Michigan offseason leagues.",
      },
    ],
  }),
  component: OffseasonsPage,
});

export function OffseasonsPage() {
  return <LeagueSelection offseason />;
}
