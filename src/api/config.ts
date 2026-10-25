/** Override at build time with VITE_API_BASE_URL (without a path prefix). */
export function apiUrl(path: string): string {
  const baseUrl = (import.meta.env["VITE_API_BASE_URL"] || "https://api.fantasyfim.com").replace(
    /\/+$/,
    "",
  );
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}
