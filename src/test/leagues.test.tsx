import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeaguesPage } from "@/routes/leagues";
import { OffseasonsPage } from "@/routes/offseasons";

function renderPage(offseason = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      {offseason ? <OffseasonsPage /> : <LeaguesPage />}
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("API leagues", () => {
  it("loads real API names and only displays FiM leagues", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { league_id: 42, league_name: "Michigan League", is_fim: true, year: 2026 },
        { league_id: 43, league_name: "Other League", is_fim: false, year: 2026 },
        { league_id: 100, league_name: "New Michigan League", is_fim: true, year: 2026 },
      ],
    });
    vi.stubGlobal("fetch", fetch);
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading leagues");
    expect(await screen.findByText("Michigan League")).toBeInTheDocument();
    expect(screen.queryByText("Other League")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("listitem").map((item) => item.querySelector("h2")?.textContent),
    ).toEqual(["New Michigan League", "Michigan League"]);
    expect(fetch).toHaveBeenCalledWith(
      "/api/leagues",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("shows an empty state for no FiM leagues", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    renderPage();
    expect(await screen.findByText("No FiM leagues are available yet.")).toBeInTheDocument();
  });

  it("shows failed requests as errors and lets the user retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({ ok: true, json: async () => [] }),
    );
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t be loaded");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByText("No FiM leagues are available yet.")).toBeInTheDocument(),
    );
  });

  it("treats malformed API data as an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ error: "unavailable" }) }),
    );
    renderPage();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("Offseason leagues", () => {
  it("filters by offseason independently of FiM and sorts IDs numerically descending", async () => {
    const leagues = [
      {
        league_id: 9,
        league_name: "Earlier offseason",
        is_fim: false,
        offseason: true,
        year: 2026,
      },
      { league_id: 100, league_name: "Regular league", is_fim: true, year: 2026 },
      { league_id: 42, league_name: "Latest offseason", is_fim: true, offseason: true, year: 2026 },
      {
        league_id: 20,
        league_name: "Middle offseason",
        is_fim: false,
        offseason: true,
        year: 2026,
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => leagues }));
    renderPage(true);
    expect(screen.getByRole("heading", { name: "Offseasons" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading offseasons");
    await screen.findByText("Latest offseason");
    expect(
      screen.getAllByRole("listitem").map((item) => item.querySelector("h2")?.textContent),
    ).toEqual(["Latest offseason", "Middle offseason", "Earlier offseason"]);
    expect(screen.queryByText("Regular league")).not.toBeInTheDocument();
    expect(leagues.map((league) => league.league_id)).toEqual([9, 100, 42, 20]);
  });

  it("shows the offseason empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { league_id: 1, league_name: "Regular league", is_fim: true, year: 2026 },
        ],
      }),
    );
    renderPage(true);
    expect(await screen.findByText("No offseasons are available yet.")).toBeInTheDocument();
  });

  it("retries a failed offseason request", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({ ok: true, json: async () => [] }),
    );
    renderPage(true);
    expect(await screen.findByRole("alert")).toHaveTextContent("Offseasons couldn’t be loaded");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No offseasons are available yet.")).toBeInTheDocument();
  });
});
