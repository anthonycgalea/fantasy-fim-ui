import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeaguesPage } from "@/routes/leagues";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><LeaguesPage /></QueryClientProvider>);
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("API leagues", () => {
  it("loads real API names and only displays FiM leagues", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [
      { league_id: 42, league_name: "Michigan League", is_fim: true, year: 2026 },
      { league_id: 43, league_name: "Other League", is_fim: false, year: 2026 },
    ] });
    vi.stubGlobal("fetch", fetch);
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading leagues");
    expect(await screen.findByText("Michigan League")).toBeInTheDocument();
    expect(screen.queryByText("Other League")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/leagues", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("shows an empty state for no FiM leagues", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    renderPage();
    expect(await screen.findByText("No FiM leagues are available yet.")).toBeInTheDocument();
  });

  it("shows failed requests as errors and lets the user retry", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => [] }));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t be loaded");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText("No FiM leagues are available yet.")).toBeInTheDocument());
  });

  it("treats malformed API data as an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ error: "unavailable" }) }));
    renderPage();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
