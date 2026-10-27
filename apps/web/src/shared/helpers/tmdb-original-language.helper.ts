/** ISO 639-1 codes commonly used as TMDB `original_language`. */
export const TMDB_ORIGINAL_LANGUAGE_CODES = [
  "en",
  "fr",
  "es",
  "de",
  "it",
  "pt",
  "ja",
  "ko",
  "zh",
  "hi",
  "ar",
  "ru",
  "tr",
  "pl",
  "nl",
  "sv",
  "no",
  "da",
  "fi",
  "cs",
  "th",
  "vi",
  "id",
  "he",
  "uk",
  "el",
  "ro",
  "hu",
] as const;

export function tmdbOriginalLanguageLabel(code: string, locale = "en"): string {
  try {
    const display = new Intl.DisplayNames([locale.split("-")[0] || "en"], { type: "language" });
    return display.of(code) ?? code;
  } catch {
    return code;
  }
}
