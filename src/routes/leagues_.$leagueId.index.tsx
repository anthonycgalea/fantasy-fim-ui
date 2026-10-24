import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/leagues_/$leagueId/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/leagues/$leagueId/rankings", params });
  },
});
