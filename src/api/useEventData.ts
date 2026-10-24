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

function parseNumber(value: unknown): number {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) {
    throw new Error("The API returned an invalid event statistic");
  }
  return number;
}

export async function fetchEventData(signal?: AbortSignal): Promise<EventData[]> {
  const data = await fetchApi<unknown>("/eventData", signal);
  if (!Array.isArray(data)) throw new Error("The API returned invalid event data");
  return data.map((value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("The API returned invalid event data");
    }
    const event = value as Record<string, unknown>;
    if (typeof event["event_name"] !== "string") {
      throw new Error("The API returned invalid event data");
    }
    const epa = (field: EpaField) => (event[field] === null ? null : parseNumber(event[field]));
    return {
      event_name: event["event_name"],
      teamcount: parseNumber(event["teamcount"]),
      maxepa: epa("maxepa"),
      top8epa: epa("top8epa"),
      top24epa: epa("top24epa"),
      avgepa: epa("avgepa"),
      medianepa: epa("medianepa"),
    };
  });
}
export function useEventData() {
  return useQuery({ queryKey: ["eventData"], queryFn: ({ signal }) => fetchEventData(signal) });
}
