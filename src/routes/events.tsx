import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyPanel } from "@/components/PageHeader";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events · Fantasy FiM" },
      { name: "description", content: "Michigan district events, weeks and scoring." },
      { property: "og:title", content: "Events · Fantasy FiM" },
      { property: "og:description", content: "Michigan district events, weeks and scoring." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Events">District events by week, through States.</PageHeader>
      <EmptyPanel label="Event schedule will load from the API" />
    </>
  ),
});
