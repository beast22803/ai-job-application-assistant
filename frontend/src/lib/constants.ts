// ── Shared constants and utilities ──

/** Resolve the API base URL depending on dev vs production mode. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.port === "3000"
    ? "http://localhost:8000"
    : "");

/** Available cover letter tone styles. */
export const STYLE_OPTIONS = [
  "Formal",
  "Corporate",
  "Technical",
  "Startup",
  "Academic",
] as const;

/** Format an ISO date string to a short human-readable form. */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Download an HTML string as a file. */
export function downloadHtmlDocument(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Copy text to clipboard with fallback alert. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Compute the verdict CSS class string based on verdict text. */
export function getVerdictClass(verdict: string): string {
  const v = verdict.toLowerCase();
  if (v.includes("strong"))
    return "text-[#30D158] border-green-500/30 bg-green-500/5";
  if (v.includes("changes"))
    return "text-[#FF9F0A] border-orange-500/30 bg-orange-500/5";
  if (v.includes("skip"))
    return "text-[#FF453A] border-red-500/30 bg-red-500/5";
  return "text-[#FFD60A] border-yellow-500/30 bg-yellow-500/5";
}
