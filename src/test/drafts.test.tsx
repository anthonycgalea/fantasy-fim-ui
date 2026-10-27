import type { AnchorHTMLAttributes, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DraftPage } from "@/components/drafts/DraftPage";
import { DraftScores } from "@/components/drafts/DraftScores";
import { buildDraftRows, countTeamWeeks } from "@/lib/draft-calculations";
import { getXpYear, parseRefreshInterval, type DraftPick } from "@/api/drafts";
import type { League } from "@/api/useLeagues";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigate,
  Link: ({
    to,
    params = {},
    search: _search,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    params?: Record<string, string>;
    search?: unknown;
    children: ReactNode;
  }) => {
    const href = Object.entries(params).reduce(
      (url, [key, value]) => url.replace(`$${key}`, value),
      to,
    );
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));
const league: League = {
  league_id: 2,
  league_name: "Michigan Draft",
  is_fim: true,
  offseason: false,
  year: 2026,
  weekly_starts: 2,
  team_limit: 4,
  team_starts: 2,
  team_size_limit: 4,
};
const picks: DraftPick[] = [
  {
    pick_number: 3,
    fantasy_team_id: 20,
    team_picked: "33",
    events: [
      { event_key: "a", week: 5 },
      { event_key: "b", week: 6 },
      { event_key: "cmp", week: 99 },
    ],
  },
  { pick_number: 1, fantasy_team_id: 10, team_picked: "27", events: [{ event_key: "c", week: 1 }] },
  { pick_number: 2, fantasy_team_id: 20, team_picked: "-1", events: [] },
];
const order = [
  { draft_slot: 1, fantasy_team_id: 10 },
  { draft_slot: 2, fantasy_team_id: 20 },
];
const available = [
  { team_number: 1, name: "Low XP", events: [{ week: 1, event_key: "a" }], match13_xp: 5 },
  {
    team_number: 2,
    name: "High XP",
    events: [
      { week: 6, event_key: "2026micmp" },
      { week: 1, event_key: "2026miket" },
      { week: 1, event_key: "2026mike2" },
    ],
    match13_xp: 70,
  },
  {
    team_number: 3,
    name: "Missing XP",
    events: [{ week: 3, event_key: "c" }],
    match13_xp: null,
  },
];
function mockApi(offseason = false, overrides: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = {
    "https://api.fantasyfim.com/drafts/7": {
      draft_id: 7,
      league_id: 2,
      event_key: "2026test",
      rounds: 2,
    },
    "https://api.fantasyfim.com/leagues/2": { ...league, offseason, is_fim: !offseason },
    "https://api.fantasyfim.com/drafts/7/picks": offseason
      ? picks.map((pick) => ({ ...pick, events: [] }))
      : picks,
    "https://api.fantasyfim.com/drafts/7/draftOrder": [...order].reverse(),
    "https://api.fantasyfim.com/leagues/2/fantasyTeams": [
      { fantasy_team_id: 10, team_name: "Alpha" },
      { fantasy_team_id: 20, team_name: "Bravo" },
    ],
    "https://api.fantasyfim.com/currentWeek?year=2026": { year: 2026, week: 2 },
    "https://api.fantasyfim.com/drafts/7/availableTeams": offseason
      ? available.map((team) => ({ ...team, events: [] }))
      : available,
    "https://api.fantasyfim.com/drafts/7/fantasyScores": [
      {
        fantasy_team_id: 10,
        fantasy_team_name: "Alpha",
        event_score: 60,
        rank_points: 2,
        teams: [
          {
            team_number: "27",
            event_score: 60,
            breakdown: {
              qual_points: 20,
              alliance_points: 10,
              elim_points: 15,
              award_points: 10,
              rookie_points: 5,
              stat_correction: 0,
            },
          },
        ],
      },
    ],
  };
  Object.assign(data, overrides);
  const fetch = vi.fn(async (input: string) => {
    if (input.startsWith("https://api.fantasyfim.com/xp?"))
      return { ok: true, json: async () => ({ "27": 90, "33": 80 }) };
    if (!(input in data)) throw new Error(`Unexpected API path: ${input}`);
    return { ok: true, json: async () => data[input] };
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
function renderPage(component = <DraftPage draftId="7" />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}>{component}</QueryClientProvider>);
  return client;
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Draft flow", () => {
  it("renders snake-order picks, empty slots, the active pick and API XP", async () => {
    const fetch = mockApi();
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading draft information");
    const board = await screen.findByRole("region", { name: /Draft board, scroll/ });
    expect(
      within(board)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Round", "Alpha", "Bravo"]);
    const cells = board.querySelectorAll("td");
    expect([...cells].map((cell) => cell.getAttribute("data-pick"))).toEqual(["1", "2", "4", "3"]);
    expect(cells[0]).toHaveTextContent("27");
    expect(cells[1]).toHaveTextContent("Picking");
    expect(cells[1]?.firstElementChild).toHaveAttribute("aria-current", "step");
    expect(cells[1]?.firstElementChild).toHaveClass("bg-yellow-100");
    expect(cells[2]?.textContent).toBe("4");
    expect(within(board).getAllByText("Picking")).toHaveLength(1);
    expect(screen.queryByText("Skipped")).not.toBeInTheDocument();
    expect(cells[3]).toHaveTextContent("33");
    expect(cells[3]).toHaveTextContent("Weeks 5, 6");
    expect(cells[3]).not.toHaveTextContent("99");
    await waitFor(() => expect(cells[0]).toHaveTextContent("XP 90"));
    expect(fetch).toHaveBeenCalledWith(
      "https://api.fantasyfim.com/xp?teams=27,33&year=2026",
      expect.anything(),
    );
    expect(within(board).getByText("27").closest("a")).toHaveAttribute(
      "href",
      "https://www.thebluealliance.com/team/27/2026",
    );
    expect(screen.getByRole("link", { name: "Back to League" })).toHaveAttribute(
      "href",
      "/leagues/2",
    );
  });

  it("advances the active pick to the lowest unpicked number and clears it when complete", async () => {
    mockApi(true, {
      "https://api.fantasyfim.com/drafts/7/picks": picks.map((pick) =>
        pick.pick_number === 2 ? { ...pick, team_picked: "1" } : pick,
      ),
    });
    renderPage();
    const board = await screen.findByRole("region", { name: /Draft board, scroll/ });
    expect(board.querySelector('[data-pick="4"]')).toHaveTextContent("Picking");
    cleanup();
    mockApi(true, {
      "https://api.fantasyfim.com/drafts/7/picks": [
        ...picks.map((pick) => (pick.pick_number === 2 ? { ...pick, team_picked: "1" } : pick)),
        { pick_number: 4, fantasy_team_id: 10, team_picked: "2", events: [] },
      ],
    });
    renderPage();
    await screen.findByRole("region", { name: /Draft board, scroll/ });
    expect(screen.queryByText("Picking")).not.toBeInTheDocument();
  });

  it.each([
    [0, "0"],
    [null, "—"],
  ] as const)("rounds picked-team XP and displays %s as %s", async (value, display) => {
    const originalFetch = mockApi();
    const fetch = vi.fn(async (input: string) => {
      if (input.startsWith("https://api.fantasyfim.com/xp?"))
        return { ok: true, json: async () => ({ "27": 2129.6, "33": value }) };
      return originalFetch(input);
    });
    vi.stubGlobal("fetch", fetch);
    renderPage();
    const board = await screen.findByRole("region", { name: /Draft board, scroll/ });
    await waitFor(() =>
      expect(board.querySelector('[data-pick="1"]')).toHaveTextContent("XP 2130"),
    );
    expect(board.querySelector('[data-pick="3"]')).toHaveTextContent(`XP ${display}`);
  });

  it("ranks zero XP ahead of unavailable teams and rounds available-team XP", async () => {
    mockApi(false, {
      "https://api.fantasyfim.com/drafts/7/availableTeams": [
        { ...available[2], match13_xp: null },
        { ...available[0], match13_xp: 0 },
        { ...available[1], match13_xp: 2129.6 },
      ],
    });
    renderPage();
    const section = await screen.findByRole("region", { name: "Available teams" });
    await within(section).findByText("High XP");
    const rows = within(section).getAllByRole("row").slice(1);
    expect(rows.map((row) => row.querySelectorAll("td")[1]?.textContent)).toEqual([
      "High XP",
      "Low XP",
      "Missing XP",
    ]);
    expect(rows.map((row) => row.querySelectorAll("td")[2]?.textContent)).toEqual([
      "2130",
      "0",
      "—",
    ]);
  });

  it.each([false, true])(
    "loads and sorts XP omitted by the available-team response (offseason: %s)",
    async (offseason) => {
      const originalFetch = mockApi(offseason, {
        "https://api.fantasyfim.com/drafts/7/availableTeams": available.map(
          ({ match13_xp: _xp, ...team }) => team,
        ),
      });
      const fetch = vi.fn(async (url: string) =>
        url === "https://api.fantasyfim.com/xp?teams=1,2,3&year=2026"
          ? { ok: true, json: async () => ({ "1": 0, "2": 2129.6, "3": null }) }
          : originalFetch(url),
      );
      vi.stubGlobal("fetch", fetch);
      renderPage();
      const section = await screen.findByRole("region", { name: "Available teams" });
      await waitFor(() => expect(within(section).getByText("2130")).toBeInTheDocument());
      expect(fetch).toHaveBeenCalledWith(
        "https://api.fantasyfim.com/xp?teams=1,2,3&year=2026",
        expect.anything(),
      );
      expect(within(section).getByText("0")).toBeInTheDocument();
      expect(within(section).getAllByText("—").length).toBeGreaterThan(0);
      const names = offseason
        ? within(section)
            .getAllByRole("link")
            .filter((link) => link.getAttribute("href")?.includes("/team/"))
            .map((link) => link.textContent)
        : within(section)
            .getAllByRole("row")
            .slice(1)
            .map((row) => row.textContent);
      expect(names).toEqual([
        expect.stringContaining("High XP"),
        expect.stringContaining("Low XP"),
        expect.stringContaining("Missing XP"),
      ]);
    },
  );

  it("sorts available teams by XP, filters weeks and searches by name", async () => {
    mockApi();
    renderPage();
    const section = await screen.findByRole("region", { name: "Available teams" });
    await within(section).findByText("High XP");
    const table = within(section).getByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual([
      "Team Number",
      "",
      "Team Name",
      "2025 XP",
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4",
      "Week 5",
      "Week 6",
    ]);
    expect(
      within(table)
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.querySelectorAll("td")[1]?.textContent),
    ).toEqual(["High XP", "Low XP", "Missing XP"]);
    const highRow = within(table).getByText("High XP").closest("tr")!;
    expect(within(highRow).getAllByRole("cell")[2]).toHaveTextContent("70");
    expect(within(highRow).getByRole("link", { name: "micmp" })).toHaveAttribute(
      "href",
      "https://www.thebluealliance.com/event/2026micmp",
    );
    expect(within(highRow).getByRole("link", { name: "miket" })).toHaveAttribute(
      "href",
      "https://www.thebluealliance.com/event/2026miket",
    );
    expect(within(highRow).getByRole("link", { name: "mike2" })).toBeInTheDocument();
    fireEvent.click(within(section).getByRole("checkbox", { name: "Week 6" }));
    expect(within(section).getByText("High XP")).toBeInTheDocument();
    fireEvent.click(within(section).getByRole("checkbox", { name: "Week 1" }));
    expect(within(section).queryByText("High XP")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "missing" } });
    expect(within(section).getAllByRole("row")).toHaveLength(2);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nothing" } });
    expect(within(section).getByText("No teams match your filters.")).toBeInTheDocument();
  });

  it("switches regular drafts to league weeks and combines weeks 5 and 6", async () => {
    mockApi();
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "League Weeks" }));
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Week 5 + 6" })).toBeInTheDocument();
    const bravo = within(table).getByRole("rowheader", { name: "Bravo" }).closest("tr")!;
    expect(
      within(bravo)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["0", "0", "0", "0", "2"]);
    expect(screen.queryByRole("heading", { name: "Available teams" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Draft" }));
    expect(await screen.findByRole("heading", { name: "Draft board" })).toBeInTheDocument();
  });

  it("keeps offseason drafts on the board, without week filters, and links to scores", async () => {
    mockApi(true);
    renderPage(<DraftPage draftId="7" initialTab="leagueWeeks" />);
    expect(await screen.findByRole("link", { name: "View Draft Scores" })).toHaveAttribute(
      "href",
      "/drafts/7/scores",
    );
    expect(await screen.findByRole("heading", { name: "Draft board" })).toBeInTheDocument();
    expect(await screen.findByText("High XP")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Available teams" })).queryByRole("table"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryAllByText("No scheduled weeks")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "League Weeks" })).not.toBeInTheDocument();
  });

  it("handles a draft with no order or available teams", async () => {
    mockApi(false, {
      "https://api.fantasyfim.com/drafts/7/draftOrder": [],
      "https://api.fantasyfim.com/drafts/7/picks": [],
      "https://api.fantasyfim.com/drafts/7/availableTeams": [],
    });
    renderPage();
    expect(await screen.findByText("The draft order hasn’t been set yet.")).toBeInTheDocument();
    expect(await screen.findByText("No teams are available for this draft.")).toBeInTheDocument();
  });

  it("shows an empty state when scores are not available", async () => {
    mockApi(true, { "https://api.fantasyfim.com/drafts/7/fantasyScores": [] });
    renderPage(<DraftScores draftId="7" />);
    expect(
      await screen.findByText("Scores aren’t available for this draft yet."),
    ).toBeInTheDocument();
  });

  it("changes auto-refresh through the draft URL", async () => {
    mockApi(true);
    renderPage();
    const settings = await screen.findByRole("button", { name: "Draft settings" });
    expect(screen.queryByRole("link", { name: "All offseasons" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Auto-refresh" })).not.toBeInTheDocument();
    fireEvent.click(settings);
    expect(screen.getByRole("combobox", { name: "Auto-refresh" })).toHaveValue("15000");
    fireEvent.change(screen.getByRole("combobox", { name: "Auto-refresh" }), {
      target: { value: "5000" },
    });
    expect(navigate).toHaveBeenCalledWith({
      to: "/drafts/$draftId",
      params: { draftId: "7" },
      search: { autoRefreshInterval: 5000 },
      replace: true,
    });
  });

  it("recovers from a failed draft request", async () => {
    const fetch = mockApi();
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Draft information couldn’t be loaded",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Michigan Draft" })).toBeInTheDocument();
  });

  it("renders scoring starts, totals, RP and expandable score breakdowns", async () => {
    mockApi(true);
    renderPage(<DraftScores draftId="7" />);
    const section = await screen.findByRole("region", { name: "Alpha" });
    expect(within(section).getByText("Unfilled start")).toBeInTheDocument();
    expect(within(section).getByText("Total").nextElementSibling).toHaveTextContent("60");
    expect(within(section).getByText("Rank points").nextElementSibling).toHaveTextContent("2");
    const details = section.querySelector("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(details.querySelector("summary")!);
    expect(details.open).toBe(true);
    expect(within(details).getByText("Qual").nextElementSibling).toHaveTextContent("20");
    expect(screen.getByRole("link", { name: "View Draft" })).toHaveAttribute("href", "/drafts/7");
  });
});

describe("Draft calculations", () => {
  it("fills numbered gaps and reverses even rounds without mutating API data", () => {
    const original = [...picks];
    expect(
      buildDraftRows(order, picks, 2).map((row) =>
        row.map((cell) => cell.pick?.team_picked ?? null),
      ),
    ).toEqual([
      ["27", "-1"],
      [null, "33"],
    ]);
    expect(picks).toEqual(original);
    expect(countTeamWeeks(20, picks)).toEqual([0, 0, 0, 0, 2]);
    expect(buildDraftRows([], [], 2)).toEqual([[], []]);
  });
  it("uses the original XP year rules", () => {
    expect(getXpYear(league)).toBe(2025);
    expect(getXpYear(league, { year: 2026, week: 1 })).toBe(2025);
    expect(getXpYear(league, { year: 2026, week: 2 })).toBe(2026);
    expect(getXpYear(league, { year: 2025, week: 3 })).toBe(2025);
    expect(getXpYear({ ...league, offseason: true })).toBe(2026);
  });
  it("rejects invalid refresh values", () => {
    for (const value of [undefined, false, true, "false", -1, 0, 200, "NaN", Infinity, [], {}])
      expect(parseRefreshInterval(value)).toBe(false);
    expect(parseRefreshInterval("5000")).toBe(5000);
  });
});
