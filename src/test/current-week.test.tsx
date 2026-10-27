import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useCurrentWeek } from "@/api/drafts";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("waits for the league year and isolates cached weeks when the year changes", async () => {
  const fetch = vi.fn(async (url: string) => ({
    ok: true,
    json: async () => ({ year: Number(new URL(url).searchParams.get("year")), week: 2 }),
  }));
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, rerender } = renderHook(({ year }) => useCurrentWeek(year), {
    initialProps: { year: undefined as number | undefined },
    wrapper,
  });
  expect(fetch).not.toHaveBeenCalled();
  rerender({ year: 2026 });
  await waitFor(() => expect(result.current.data?.year).toBe(2026));
  rerender({ year: 2025 });
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data?.year).toBe(2025));
  expect(fetch).toHaveBeenCalledWith(
    "https://api.fantasyfim.com/currentWeek?year=2025",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(client.getQueryData(["currentWeek", 2026])).toEqual({ year: 2026, week: 2 });
  client.clear();
});
