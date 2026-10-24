import { createFileRoute } from "@tanstack/react-router";
import { OffseasonDrafts } from "@/components/OffseasonDrafts";

export const Route = createFileRoute("/offseasons")({
  head: () => ({
    meta: [
      { title: "Offseasons · Fantasy FiM" },
      { name: "description", content: "Browse Fantasy FIRST in Michigan offseason drafts." },
      { property: "og:title", content: "Offseasons · Fantasy FiM" },
      {
        property: "og:description",
        content: "Browse Fantasy FIRST in Michigan offseason drafts.",
      },
    ],
  }),
  component: OffseasonsPage,
});

export function OffseasonsPage() {
  return <OffseasonDrafts />;
}
