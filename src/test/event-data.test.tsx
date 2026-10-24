import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventDataPage } from "@/components/events/EventDataPage";
import { getDifficultyHue, getEpaRanges, sortEvents } from "@/lib/event-data";
import { fetchEventData, type EventData } from "@/api/useEventData";

const events: EventData[] = [
  {
    event_name: "Zulu District",
    teamcount: 40,
    maxepa: 100,
    top8epa: 80,
    top24epa: 70,
    avgepa: 65.4,
    medianepa: 60,
  },
  {
    event_name: "Alpha District",
    teamcount: 32,
    maxepa: 20,
    top8epa: 10,
    top24epa: null,
    avgepa: 5.6,
    medianepa: 8,
  },
  {
    event_name: "Middle District",
    teamcount: 36,
    maxepa: 60,
    top8epa: 50,
    top24epa: 0,
    avgepa: 40,
    medianepa: 35,
  },
];
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={client}>
      <EventDataPage />
    </QueryClientProvider>,
  );
}
function mockData(data: unknown = events) {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Event data", () => {
  it("loads original event statistics and sorts event names by default", async () => {
    const fetch = mockData();
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading event data");
    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual([
      "Event Name",
      "Team Count",
      "Max EPA",
      "EPA 8",
      "EPA 24",
      "Average EPA",
      "Median EPA",
    ]);
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Alpha District", "Middle District", "Zulu District"]);
    const alpha = within(table).getByRole("rowheader", { name: "Alpha District" }).closest("tr")!;
    expect(
      within(alpha)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["32", "20", "10", "—", "6", "8"]);
    const middle = within(table).getByRole("rowheader", { name: "Middle District" }).closest("tr")!;
    expect(within(middle).getAllByRole("cell")[3]).toHaveTextContent("0");
    expect(fetch).toHaveBeenCalledWith(
      "/api/eventData",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("accepts decimal strings from the real API response", async () => {
    mockData([
      {
        avgepa: "1703.7500000000000000",
        event_name: "FIM District Troy Event",
        maxepa: 2151,
        medianepa: 1695.5,
        teamcount: 12,
        top24epa: null,
        top8epa: 1657,
      },
      {
        avgepa: "1610.6153846153846154",
        event_name: "FIM District Chelsea Event",
        maxepa: 2001,
        medianepa: 1589,
        teamcount: 13,
        top24epa: null,
        top8epa: 1561,
      },
    ]);
    renderPage();
    const table = await screen.findByRole("table");
    const troy = within(table)
      .getByRole("rowheader", { name: "FIM District Troy Event" })
      .closest("tr")!;
    expect(
      within(troy)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["12", "2151", "1657", "—", "1704", "1696"]);
    fireEvent.click(screen.getByRole("button", { name: "Average EPA" }));
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent),
    ).toEqual(["FIM District Chelsea Event", "FIM District Troy Event"]);
    const normalized = await fetchEventData();
    expect(normalized[0]?.avgepa).toBe(1703.75);
    expect(normalized[0]?.top24epa).toBeNull();
  });

  it.each(["", "unknown", "NaN", "Infinity", true, {}])(
    "rejects invalid numeric statistics: %s",
    async (value) => {
      mockData([{ ...events[0], avgepa: value }]);
      await expect(fetchEventData()).rejects.toThrow("invalid event statistic");
    },
  );

  it("toggles numeric sorting and exposes the selected direction", async () => {
    mockData();
    renderPage();
    const table = await screen.findByRole("table");
    const header = within(table).getByRole("columnheader", { name: "Max EPA" });
    fireEvent.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Alpha District", "Middle District", "Zulu District"]);
    fireEvent.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Zulu District", "Middle District", "Alpha District"]);
    fireEvent.click(screen.getByRole("button", { name: "EPA 24" }));
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Middle District", "Zulu District", "Alpha District"]);
  });

  it("searches event names and handles no matches", async () => {
    mockData();
    renderPage();
    await screen.findByRole("table");
    fireEvent.change(screen.getByRole("searchbox", { name: "Find an event" }), {
      target: { value: " zULu " },
    });
    expect(screen.getAllByRole("rowheader")).toHaveLength(1);
    expect(screen.getByText("1 of 3 events · Select a column to sort")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "absent" } });
    expect(screen.getByText("No events match your search.")).toBeInTheDocument();
  });

  it("shows empty API results", async () => {
    mockData([]);
    renderPage();
    expect(await screen.findByText("Event data isn’t available yet.")).toBeInTheDocument();
  });

  it("retries failed requests", async () => {
    const fetch = mockData();
    fetch.mockResolvedValueOnce({ ok: false, status: 503 });
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("Event data couldn’t be loaded");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("treats malformed statistics as an error", async () => {
    mockData([{ event_name: "Invalid", teamcount: 20, maxepa: "unknown" }]);
    renderPage();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("Event comparison calculations", () => {
  it("scales each EPA column independently, including zero and excluding missing values", () => {
    const ranges = getEpaRanges(events);
    expect(ranges.maxepa).toEqual({ min: 20, max: 100 });
    expect(ranges.top24epa).toEqual({ min: 0, max: 70 });
    expect(getDifficultyHue(20, ranges.maxepa!)).toBe(140);
    expect(getDifficultyHue(100, ranges.maxepa!)).toBe(0);
    expect(Number.isFinite(getDifficultyHue(20, { min: 20, max: 20 }))).toBe(true);
    expect(getEpaRanges([]).maxepa).toBeNull();
  });
  it("keeps missing values last in both sort directions without mutating API results", () => {
    const before = [...events];
    expect(sortEvents(events, "top24epa", "ascending").at(-1)?.event_name).toBe("Alpha District");
    expect(sortEvents(events, "top24epa", "descending").at(-1)?.event_name).toBe("Alpha District");
    expect(events).toEqual(before);
  });
});
