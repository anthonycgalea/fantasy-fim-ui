import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./drafts";

export type EventData = {
  event_name: string;
  teamcount: number;
  maxepa: number | null;
  top8epa: number | null;
  top24epa: number | null;
  avgepa: number | null;
  medianepa: number | null;
};
export const epaFields = ["maxepa", "top8epa", "top24epa", "avgepa", "medianepa"] as const;
export type EpaField = (typeof epaFields)[number];

export async function fetchEventData(signal?: AbortSignal): Promise<EventData[]> {
  const data = await fetchApi<unknown>("/eventData", signal);
  if (
    !Array.isArray(data) ||
    !data.every(
      (event) =>
        event &&
        typeof event.event_name === "string" &&
        Number.isFinite(event.teamcount) &&
        epaFields.every((key) => event[key] === null || Number.isFinite(event[key])),
    )
  ) {
    throw new Error("The API returned invalid event data");
  }
  return data as EventData[];
}
export function useEventData() {
  return useQuery({ queryKey: ["eventData"], queryFn: ({ signal }) => fetchEventData(signal) });
}
