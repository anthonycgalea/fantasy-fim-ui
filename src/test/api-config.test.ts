import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchApi } from "@/api/drafts";
import { fetchLeagues } from "@/api/useLeagues";
import { apiUrl } from "@/api/config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("API origin configuration", () => {
  it.each([true, false])("uses the new origin without a prefix (development: %s)", async (dev) => {
    vi.stubEnv("DEV", dev);
    vi.stubEnv("VITE_API_BASE_URL", "");
    const values = { "27": 2129, "33": null };
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => values });
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    expect(await fetchApi("/xp?teams=27,33&year=2026", controller.signal)).toEqual(values);
    expect(fetch).toHaveBeenCalledWith("https://api.fantasyfim.com/xp?teams=27,33&year=2026", {
      signal: controller.signal,
    });
    expect(apiUrl("/apidocs/")).toBe("https://api.fantasyfim.com/apidocs/");
  });

  it("applies an environment override to both fetch helpers and removes trailing slashes", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://staging.example.com///");
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetch);
    await fetchApi("/currentWeek");
    await fetchLeagues(undefined, 2026);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "https://staging.example.com/currentWeek",
      "https://staging.example.com/leagues?year=2026",
    ]);
  });
});
