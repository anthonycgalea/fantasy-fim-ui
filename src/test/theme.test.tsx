import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "../components/ThemeToggle";
import { themeScript, themeStorageKey } from "../lib/theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("theme preference", () => {
  it("initializes the page from a saved preference before hydration", () => {
    localStorage.setItem(themeStorageKey, "dark");
    window.eval(themeScript);
    expect(document.documentElement).toHaveClass("dark");
    localStorage.setItem(themeStorageKey, "light");
    window.eval(themeScript);
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("toggles and persists the preference across remounts", () => {
    const view = render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(themeStorageKey)).toBe("dark");
    view.unmount();
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Dark mode" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem(themeStorageKey)).toBe("light");
  });

  it("follows system changes until a preference is saved", () => {
    let onChange = () => {};
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    vi.spyOn(window, "matchMedia").mockReturnValue(media);
    vi.spyOn(media, "addEventListener").mockImplementation((_event, listener) => {
      onChange = listener as () => void;
    });
    render(<ThemeToggle />);
    Object.defineProperty(media, "matches", { value: true, configurable: true });
    fireEvent(window, new Event("storage"));
    expect(document.documentElement).toHaveClass("dark");
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    act(() => onChange());
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("works when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    expect(() => window.eval(themeScript)).not.toThrow();
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(document.documentElement).toHaveClass("dark");
  });
});
