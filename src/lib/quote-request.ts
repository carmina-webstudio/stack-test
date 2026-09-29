// Hands a few details from the quote form to the thank-you page for this browser tab only.
// Storage can be blocked (private mode, strict settings), so every access is wrapped in
// try/catch and the thank-you page falls back to a generic message.

export const QUOTE_SUMMARY_KEY = "quote-request";

export type QuoteSummary = {
  firstName: string;
  service: string;
  city: string;
  email: string;
};

export function saveQuoteSummary(summary: QuoteSummary) {
  try {
    sessionStorage.setItem(QUOTE_SUMMARY_KEY, JSON.stringify(summary));
  } catch {
    // Storage unavailable: the thank-you page shows its generic version.
  }
}

/** Raw stored string (stable between calls, so it works as a useSyncExternalStore snapshot). */
export function readQuoteSummaryRaw(): string | null {
  try {
    return sessionStorage.getItem(QUOTE_SUMMARY_KEY);
  } catch {
    return null;
  }
}

export function parseQuoteSummary(raw: string | null): QuoteSummary | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<QuoteSummary>;
    const { firstName, service, city, email } = data;
    if (
      typeof firstName !== "string" ||
      typeof service !== "string" ||
      typeof city !== "string" ||
      typeof email !== "string" ||
      !firstName ||
      !service ||
      !city ||
      !email
    ) {
      return null;
    }
    return { firstName, service, city, email };
  } catch {
    return null;
  }
}
