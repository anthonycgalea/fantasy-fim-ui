import { createFileRoute } from "@tanstack/react-router";
import { LeagueSelection } from "@/components/LeagueSelection";

export const Route = createFileRoute("/leagues")({
  head: () => ({
    meta: [
      { title: "Leagues · Fantasy FiM" },
      { name: "description", content: "Browse and join Fantasy FIRST in Michigan leagues." },
      { property: "og:title", content: "Leagues · Fantasy FiM" },
      { property: "og:description", content: "Browse and join Fantasy FIRST in Michigan leagues." },
    ],
  }),
  component: LeaguesPage,
});

export function LeaguesPage() {
  return <LeagueSelection />;
}
