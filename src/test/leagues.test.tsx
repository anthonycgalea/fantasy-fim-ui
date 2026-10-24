import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { LeaguesPage } from "@/routes/leagues";
import { OffseasonsPage } from "@/routes/offseasons";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ params, children }: { params: { draftId: string }; children: ReactNode }) => (
    <a href={`/drafts/${params.draftId}`}>{children}</a>
  ),
}));

function renderPage(offseason = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      {offseason ? <OffseasonsPage /> : <LeaguesPage />}
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
      observe() {
        this.callback([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
  );
});

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
    const fetch = vi.fn(async (url: string) => {
      const id = Number(url.match(/leagues\/(\d+)\/drafts/)?.[1]);
      return {
        ok: true,
        json: async () =>
          url === "/api/leagues"
            ? leagues
            : [
                { draft_id: id * 10 + 1, league_id: id, event_key: `2026second${id}`, rounds: 3 },
                { draft_id: id * 10, league_id: id, event_key: `2026event${id}`, rounds: 2 },
              ],
      };
    });
    vi.stubGlobal("fetch", fetch);
    renderPage(true);
    expect(screen.getByRole("heading", { name: "Offseasons" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading offseasons");
    await screen.findByRole("link", { name: /2026second42/ });
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Latest offseason", "Middle offseason", "Earlier offseason"]);
    expect(screen.queryByRole("link", { name: /2026event42/ })).not.toBeInTheDocument();
    const card = screen.getByRole("link", { name: /Latest offseason/ });
    expect(card).toHaveAttribute("href", "/drafts/421");
    expect(card).toContainElement(screen.getByRole("heading", { name: "Latest offseason" }));
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(fetch).toHaveBeenCalledWith("/api/leagues/42/drafts", expect.anything());
    expect(fetch).not.toHaveBeenCalledWith("/api/leagues/100/drafts", expect.anything());
    expect(screen.queryByRole("link", { name: /View league/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Regular league")).not.toBeInTheDocument();
    expect(leagues.map((league) => league.league_id)).toEqual([9, 100, 42, 20]);
  });

  it("only looks up links when their cards approach the viewport", async () => {
    const intersections = new Map<Element, (visible: boolean) => void>();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
        observe(element: Element) {
          intersections.set(element, (visible) => this.callback([{ isIntersecting: visible }]));
        }
        disconnect() {}
      },
    );
    const fetch = vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url === "/api/leagues"
          ? [
              {
                league_id: 2,
                league_name: "Latest offseason",
                is_fim: false,
                offseason: true,
                year: 2026,
              },
              {
                league_id: 1,
                league_name: "Earlier offseason",
                is_fim: false,
                offseason: true,
                year: 2025,
              },
            ]
          : [{ draft_id: url.includes("/2/") ? 20 : 10, event_key: "event", rounds: 2 }],
    }));
    vi.stubGlobal("fetch", fetch);
    renderPage(true);
    const firstCard = (await screen.findByRole("heading", { name: "Latest offseason" })).closest(
      "li",
    )!;
    const secondCard = screen.getByRole("heading", { name: "Earlier offseason" }).closest("li")!;
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    act(() => intersections.get(firstCard)!(false));
    expect(fetch).toHaveBeenCalledTimes(1);
    act(() => intersections.get(firstCard)!(true));
    expect(await screen.findByRole("link", { name: /Latest offseason/ })).toHaveAttribute(
      "href",
      "/drafts/20",
    );
    expect(fetch).not.toHaveBeenCalledWith("/api/leagues/1/drafts", expect.anything());
    act(() => intersections.get(secondCard)!(true));
    expect(await screen.findByRole("link", { name: /Earlier offseason/ })).toHaveAttribute(
      "href",
      "/drafts/10",
    );
  });

  it("omits offseason leagues with no drafts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          url === "/api/leagues"
            ? [
                {
                  league_id: 1,
                  league_name: "Empty offseason",
                  is_fim: false,
                  offseason: true,
                  year: 2026,
                },
                {
                  league_id: 2,
                  league_name: "Ready offseason",
                  is_fim: false,
                  offseason: true,
                  year: 2026,
                },
              ]
            : url === "/api/leagues/1/drafts"
              ? []
              : [{ draft_id: 7, league_id: 2, event_key: "2026ready", rounds: 2 }],
      })),
    );
    renderPage(true);
    expect(await screen.findByRole("link", { name: /2026ready/ })).toHaveAttribute(
      "href",
      "/drafts/7",
    );
    await waitFor(() => expect(screen.queryByText("Empty offseason")).not.toBeInTheDocument());
  });

  it("shows an empty state when offseason leagues have no drafts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          url === "/api/leagues"
            ? [
                {
                  league_id: 1,
                  league_name: "Empty offseason",
                  is_fim: false,
                  offseason: true,
                  year: 2026,
                },
              ]
            : [],
      })),
    );
    renderPage(true);
    expect(await screen.findByText("No offseason drafts are available yet.")).toBeInTheDocument();
  });

  it("retries a failed draft lookup while preserving other offseason links", async () => {
    let failed = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/leagues/2/drafts" && !failed) {
          failed = true;
          return { ok: false, status: 503 };
        }
        return {
          ok: true,
          json: async () =>
            url === "/api/leagues"
              ? [
                  {
                    league_id: 1,
                    league_name: "Ready offseason",
                    is_fim: false,
                    offseason: true,
                    year: 2026,
                  },
                  {
                    league_id: 2,
                    league_name: "Retry offseason",
                    is_fim: false,
                    offseason: true,
                    year: 2026,
                  },
                ]
              : [
                  {
                    draft_id: url.includes("/2/") ? 8 : 7,
                    event_key: url.includes("/2/") ? "2026retry" : "2026ready",
                    rounds: 2,
                  },
                ],
        };
      }),
    );
    renderPage(true);
    expect(await screen.findByRole("alert")).toHaveTextContent("Retry offseason");
    expect(await screen.findByRole("link", { name: /2026ready/ })).toHaveAttribute(
      "href",
      "/drafts/7",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: /2026retry/ })).toHaveAttribute(
      "href",
      "/drafts/8",
    );
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
