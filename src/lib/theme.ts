export const themeStorageKey = "fantasy-fim-theme";

// Runs before styles and hydration so the first paint uses the chosen theme.
export const themeScript = `(() => {
  let theme;
  try { theme = localStorage.getItem("fantasy-fim-theme"); } catch {}
  const dark = theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();`;
