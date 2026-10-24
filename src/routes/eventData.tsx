import { createFileRoute } from "@tanstack/react-router";
import { EventDataPage } from "@/components/events/EventDataPage";
export const Route = createFileRoute("/eventData")({
  head: () => ({
    meta: [
      { title: "Event Data · Fantasy FiM" },
      {
        name: "description",
        content: "Compare FIRST in Michigan event difficulty with sortable EPA statistics.",
      },
      { property: "og:title", content: "Event Data · Fantasy FiM" },
    ],
  }),
  component: EventDataPage,
});
