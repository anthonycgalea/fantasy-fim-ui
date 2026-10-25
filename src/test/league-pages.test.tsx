import type { AnchorHTMLAttributes, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Rankings } from "@/components/leagues/Rankings";
import { LeagueScores } from "@/components/leagues/LeagueScores";
import { LeagueRosters } from "@/components/leagues/LeagueRosters";
import { LeagueTeamPool } from "@/components/leagues/LeagueTeamPool";
import { LeagueWaivers } from "@/components/leagues/LeagueWaivers";
import { LeagueLayout } from "@/components/leagues/LeagueLayout";
import { LeagueDrafts } from "@/components/leagues/LeagueDrafts";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Outlet: () => <div>League child view</div>,
  Link: ({
    to,
    params = {},
    search: _search,
    activeProps: _active,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    params?: Record<string, string>;
    search?: unknown;
    activeProps?: unknown;
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
const league = {
  league_id: 2,
  league_name: "Michigan League",
  year: 2026,
  is_fim: true,
  offseason: false,
  weekly_starts: 2,
};
const teams = [
  { fantasy_team_id: 10, team_name: "Alpha" },
  { fantasy_team_id: 20, team_name: "Bravo" },
];
const pool = [
  { team_number: 27, name: "Low XP", events: [{ event_key: "a", week: 1 }], match13_xp: 30 },
  { team_number: 33, name: "High XP", events: [{ event_key: "b", week: 6 }], match13_xp: 90 },
  { team_number: 67, name: "Unknown XP", events: [{ event_key: "c", week: 3 }] },
];
const breakdown = {
  qual_points: 25,
  alliance_points: 15,
  elim_points: 10,
  award_points: 5,
  rookie_points: 0,
  stat_correction: -2,
};
function mockApi(overrides: Record<string, unknown> = {}, failures: Record<string, number> = {}) {
  const data: Record<string, unknown> = {
    "/api/leagues/2": league,
    "/api/leagues/2/drafts": [{ draft_id: 7, event_key: "2026test", rounds: 2, league_id: 2 }],
    "/api/leagues/2/rankings": [
      {
        fantasy_team_id: 20,
        fantasy_team_name: "Bravo",
        total_ranking_points: 10,
        tiebreaker: 300,
      },
      { fantasy_team_id: 10, fantasy_team_name: "Alpha", total_ranking_points: 8, tiebreaker: 350 },
    ],
    "/api/currentWeek": { year: 2026, week: 2 },
    "/api/leagues/2/fantasyTeams": teams,
    "/api/leagues/2/lineups": [1, 2].map((week) => ({
      week,
      fantasy_teams: [
        {
          fantasy_team_id: 10,
          fantasy_team_name: "Alpha",
          teams: [{ team_number: "27" }, { team_number: "33" }],
        },
        { fantasy_team_id: 20, fantasy_team_name: "Bravo", teams: [{ team_number: "67" }] },
      ],
    })),
    "/api/leagues/2/fantasyScores/1": [
      {
        fantasy_team_id: 10,
        fantasy_team_name: "Alpha",
        weekly_score: 50,
        rank_points: 1,
        teams: [{ team_number: "27", weekly_score: 50, breakdown }],
      },
    ],
    "/api/leagues/2/fantasyScores/2": [
      {
        fantasy_team_id: 10,
        fantasy_team_name: "Alpha",
        weekly_score: 80,
        rank_points: 3,
        teams: [
          { team_number: "27", weekly_score: 53, breakdown },
          { team_number: "33", weekly_score: 27 },
        ],
      },
    ],
    "/api/leagues/2/rosters": [
      { fantasy_team_id: 10, fantasy_team_name: "Alpha", roster: ["frc27", "33"] },
      { fantasy_team_id: 20, fantasy_team_name: "Bravo", roster: [] },
    ],
    "/api/leagues/2/rosterWeeks": [
      {
        fantasy_team_id: 10,
        fantasy_team_name: "Alpha",
        roster: [
          {
            team_key: "frc27",
            events: [
              { event_key: "2026mi1", event_name: "First Event", week: 1 },
              { event_key: "2026mi6", event_name: "Sixth Event", week: 6 },
              { event_key: "2026mi7", event_name: "Seventh Event", week: 7 },
            ],
          },
        ],
      },
    ],
    "/api/leagues/2/availableTeams": pool,
    "/api/leagues/2/teamsOnWaivers": pool,
    "/api/leagues/2/waiverPriority": [
      { fantasy_team_id: 20, fantasy_team_name: "Bravo", priority: 1 },
      { fantasy_team_id: 10, fantasy_team_name: "Alpha", priority: 2 },
    ],
    ...overrides,
  };
  const fetch = vi.fn(async (url: string) => {
    if (failures[url]) {
      failures[url]--;
      return { ok: false, status: 503, json: async () => ({}) };
    }
    if (!(url in data)) throw new Error(`Unexpected endpoint: ${url}`);
    return { ok: true, json: async () => data[url] };
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
function renderPage(component: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}>{component}</QueryClientProvider>);
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("League pages", () => {
  it("preserves the API ranking order and displays points and tiebreaker", async () => {
    mockApi();
    renderPage(<Rankings leagueId="2" />);
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Bravo");
    expect(
      within(rows[0]!)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["1", "10", "300"]);
    expect(rows[1]).toHaveTextContent("Alpha");
  });

  it("starts with the current league week and preserves the chosen week", async () => {
    const fetch = mockApi();
    renderPage(<LeagueScores leagueId="2" />);
    const select = await screen.findByRole("combobox", { name: "Week" });
    await waitFor(() => expect(select).toHaveValue("2"));
    const alpha = screen.getByRole("region", { name: "Alpha" });
    await waitFor(() =>
      expect(within(alpha).getByText("Total").nextElementSibling).toHaveTextContent("80"),
    );
    expect(within(alpha).getByText("Rank points").nextElementSibling).toHaveTextContent("3");
    const details = alpha.querySelector("details")!;
    fireEvent.click(details.querySelector("summary")!);
    expect(details.open).toBe(true);
    expect(within(details).getByText("Stat Corr").nextElementSibling).toHaveTextContent("-2");
    expect(
      within(screen.getByRole("region", { name: "Bravo" })).getByText("Unfilled start"),
    ).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "1" } });
    await waitFor(() =>
      expect(
        within(screen.getByRole("region", { name: "Alpha" })).getByText("Total").nextElementSibling,
      ).toHaveTextContent("50"),
    );
    expect(select).toHaveValue("1");
    expect(fetch).toHaveBeenCalledWith(
      "/api/leagues/2/fantasyScores/1",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("uses the first available week when the current week is from another year", async () => {
    mockApi({ "/api/currentWeek": { year: 2025, week: 2 } });
    renderPage(<LeagueScores leagueId="2" />);
    expect(await screen.findByRole("combobox", { name: "Week" })).toHaveValue("1");
  });

  it("keeps lineups visible when score requests fail and allows retry", async () => {
    mockApi(
      { "/api/currentWeek": { year: 2025, week: 1 } },
      { "/api/leagues/2/fantasyScores/1": 1 },
    );
    renderPage(<LeagueScores leagueId="2" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Lineups are shown below");
    expect(screen.getByRole("region", { name: "Alpha" })).toHaveTextContent("27");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    await waitFor(() =>
      expect(
        within(screen.getByRole("region", { name: "Alpha" })).getByText("Total").nextElementSibling,
      ).toHaveTextContent("50"),
    );
  });

  it("switches from all rosters to a fantasy team's event schedule", async () => {
    mockApi();
    renderPage(<LeagueRosters leagueId="2" />);
    expect(await screen.findByRole("region", { name: "Alpha" })).toHaveTextContent("27");
    expect(screen.getByRole("link", { name: "27" })).toHaveAttribute(
      "href",
      "https://www.thebluealliance.com/team/27/2026",
    );
    expect(screen.getByText("This roster is empty.")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Fantasy team" });
    fireEvent.change(select, { target: { value: "10" } });
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Week 7" })).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "2026mi6" })).toHaveAttribute(
      "href",
      "https://www.thebluealliance.com/event/2026mi6",
    );
    fireEvent.change(select, { target: { value: "20" } });
    expect(
      await screen.findByText("No roster schedule is available for this fantasy team."),
    ).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "all" } });
    expect(await screen.findByRole("region", { name: "Alpha" })).toBeInTheDocument();
  });

  it("filters available teams by week and name while preserving XP order", async () => {
    mockApi();
    renderPage(<LeagueTeamPool leagueId="2" />);
    const section = await screen.findByRole("region", { name: "Available teams" });
    expect(
      within(section)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual([
      expect.stringContaining("High XP"),
      expect.stringContaining("Low XP"),
      expect.stringContaining("Unknown XP"),
    ]);
    expect(within(section).queryByRole("checkbox", { name: "Week 5" })).not.toBeInTheDocument();
    fireEvent.click(within(section).getByRole("checkbox", { name: "Week 6" }));
    expect(within(section).queryByText("High XP")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "unknown" } });
    expect(within(section).getAllByRole("link")).toHaveLength(1);
    expect(within(section).getByText("—")).toBeInTheDocument();
  });

  it("shows non-FiM teams without week filtering", async () => {
    mockApi({
      "/api/leagues/2": { ...league, is_fim: false, offseason: true },
      "/api/leagues/2/availableTeams": [
        { ...pool[0], events: [{ event_key: "offseason", week: 99 }] },
      ],
    });
    renderPage(<LeagueTeamPool leagueId="2" />);
    expect(await screen.findByText("Low XP")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("switches between waiver teams and waiver priority", async () => {
    const fetch = mockApi();
    renderPage(<LeagueWaivers leagueId="2" />);
    expect(await screen.findByRole("region", { name: "Teams on waivers" })).toHaveTextContent(
      "High XP",
    );
    fireEvent.click(screen.getByRole("button", { name: "Waiver Priority" }));
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("1Bravo");
    expect(fetch).toHaveBeenCalledWith("/api/leagues/2/waiverPriority", expect.anything());
    fireEvent.click(screen.getByRole("button", { name: "Teams on Waivers" }));
    expect(await screen.findByRole("region", { name: "Teams on waivers" })).toBeInTheDocument();
  });

  it("links all league views and uses the first FiM draft", async () => {
    mockApi();
    renderPage(<LeagueLayout leagueId="2" />);
    const nav = await screen.findByRole("navigation", { name: "League navigation" });
    expect(within(nav).getByRole("link", { name: "Rankings" })).toHaveAttribute(
      "href",
      "/leagues/2/rankings",
    );
    expect(within(nav).getByRole("link", { name: "Rosters" })).toHaveAttribute(
      "href",
      "/leagues/2/rosters",
    );
    await waitFor(() =>
      expect(within(nav).getByRole("link", { name: "Draft" })).toHaveAttribute("href", "/drafts/7"),
    );
    expect(screen.getByText("League child view")).toBeInTheDocument();
  });

  it("links offseason leagues to their draft selection", async () => {
    mockApi({ "/api/leagues/2": { ...league, is_fim: false, offseason: true } });
    renderPage(<LeagueLayout leagueId="2" />);
    expect(await screen.findByRole("link", { name: "Drafts" })).toHaveAttribute(
      "href",
      "/leagues/2/drafts",
    );
    expect(screen.getByRole("link", { name: "All offseasons" })).toHaveAttribute(
      "href",
      "/offseasons",
    );
  });

  it("keeps draft selection available and links to the draft board", async () => {
    mockApi();
    renderPage(<LeagueDrafts leagueId="2" />);
    expect(await screen.findByRole("link", { name: /2026test/ })).toHaveAttribute(
      "href",
      "/drafts/7",
    );
  });

  it("retries a failed rankings request", async () => {
    mockApi({}, { "/api/leagues/2/rankings": 1 });
    renderPage(<Rankings leagueId="2" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Rankings couldn’t be loaded");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it.each([
    [
      "rankings",
      "/api/leagues/2/rankings",
      <Rankings leagueId="2" />,
      "Rankings aren’t available for this league yet.",
    ],
    [
      "lineups",
      "/api/leagues/2/lineups",
      <LeagueScores leagueId="2" />,
      "No lineups have been submitted for this league yet.",
    ],
    [
      "rosters",
      "/api/leagues/2/rosters",
      <LeagueRosters leagueId="2" />,
      "No rosters are available for this league yet.",
    ],
    [
      "available teams",
      "/api/leagues/2/availableTeams",
      <LeagueTeamPool leagueId="2" />,
      "No teams are available in this league.",
    ],
    [
      "waivers",
      "/api/leagues/2/teamsOnWaivers",
      <LeagueWaivers leagueId="2" />,
      "No teams are on waivers.",
    ],
  ] as const)("handles empty %s", async (_name, endpoint, component, label) => {
    mockApi({ [endpoint]: [] });
    renderPage(component);
    expect(await screen.findByText(label)).toBeInTheDocument();
  });
});
