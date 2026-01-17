import langs from "langs";

const FLAG_ICONS_CDN = "https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3";

export function detectLanguage(input?: string | null) {
  if (!input) return null;

  const clean = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, "");

  const found =
    langs.where("1", clean) ||
    langs.where("2", clean) ||
    langs.where("2B", clean) ||
    langs.where("3", clean) ||
    langs.where("name", input.trim().charAt(0).toUpperCase() + input.trim().slice(1));

  return found;
}

const exceptions: Record<string, string> = {
  us: "us",
  en: "us",
  english: "us",
  ja: "jp",
  jpn: "jp",
  ko: "kr",
  kor: "kr",
  ukr: "ua",
  zh: "cn",
  el: "gr",
  da: "dk",
  sv: "se",
  fil: "ph",
};

export function getFlagUrl(langCode?: string) {
  if (!langCode) return "";

  const base = langCode.split("-")?.[0] || langCode;
  const country = exceptions[base?.toLowerCase()] || detectLanguage(base)?.[1];
  return `${FLAG_ICONS_CDN}/${country}.svg`;
}
