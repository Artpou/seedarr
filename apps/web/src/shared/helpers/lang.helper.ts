const FLAGS_API_URL = "https://flagsapi.com";

export function getFlagUrl(country?: string) {
  if (!country) return "";
  switch (country.toUpperCase()) {
    case "EN":
      country = "US";
      break;
    case "KO":
      country = "KR";
      break;
    case "ZH":
      country = "TW";
      break;
    default:
      country = country.toUpperCase();
      break;
  }
  return `${FLAGS_API_URL}/${country}/flat/64.png`;
}

/**
 * Language mapping with ISO 639-1 (2-letter), ISO 639-2 (3-letter), and common names
 */
const LANGUAGE_MAP: Record<string, { code: string; name: string }> = {
  // English
  en: { code: "en", name: "English" },
  eng: { code: "en", name: "English" },
  english: { code: "en", name: "English" },
  "en-us": { code: "en", name: "English" },
  "en-gb": { code: "en", name: "English" },
  "en-uk": { code: "en", name: "English" },

  // French
  fr: { code: "fr", name: "French" },
  fre: { code: "fr", name: "French" },
  fra: { code: "fr", name: "French" },
  french: { code: "fr", name: "French" },
  "fr-fr": { code: "fr", name: "French" },
  "fr-ca": { code: "fr", name: "French" },

  // Spanish
  es: { code: "es", name: "Spanish" },
  spa: { code: "es", name: "Spanish" },
  spanish: { code: "es", name: "Spanish" },
  "es-es": { code: "es", name: "Spanish" },
  "es-mx": { code: "es", name: "Spanish" },

  // German
  de: { code: "de", name: "German" },
  ger: { code: "de", name: "German" },
  deu: { code: "de", name: "German" },
  german: { code: "de", name: "German" },
  "de-de": { code: "de", name: "German" },

  // Italian
  it: { code: "it", name: "Italian" },
  ita: { code: "it", name: "Italian" },
  italian: { code: "it", name: "Italian" },
  "it-it": { code: "it", name: "Italian" },

  // Portuguese
  pt: { code: "pt", name: "Portuguese" },
  por: { code: "pt", name: "Portuguese" },
  portuguese: { code: "pt", name: "Portuguese" },
  "pt-pt": { code: "pt", name: "Portuguese" },
  "pt-br": { code: "pt", name: "Portuguese" },

  // Russian
  ru: { code: "ru", name: "Russian" },
  rus: { code: "ru", name: "Russian" },
  russian: { code: "ru", name: "Russian" },
  "ru-ru": { code: "ru", name: "Russian" },

  // Japanese
  ja: { code: "ja", name: "Japanese" },
  jpn: { code: "ja", name: "Japanese" },
  japanese: { code: "ja", name: "Japanese" },
  "ja-jp": { code: "ja", name: "Japanese" },

  // Korean
  ko: { code: "ko", name: "Korean" },
  kor: { code: "ko", name: "Korean" },
  korean: { code: "ko", name: "Korean" },
  "ko-kr": { code: "ko", name: "Korean" },

  // Chinese
  zh: { code: "zh", name: "Chinese" },
  chi: { code: "zh", name: "Chinese" },
  zho: { code: "zh", name: "Chinese" },
  chinese: { code: "zh", name: "Chinese" },
  "zh-cn": { code: "zh", name: "Chinese" },
  "zh-tw": { code: "zh", name: "Chinese" },

  // Arabic
  ar: { code: "ar", name: "Arabic" },
  ara: { code: "ar", name: "Arabic" },
  arabic: { code: "ar", name: "Arabic" },
  "ar-sa": { code: "ar", name: "Arabic" },

  // Hindi
  hi: { code: "hi", name: "Hindi" },
  hin: { code: "hi", name: "Hindi" },
  hindi: { code: "hi", name: "Hindi" },
  "hi-in": { code: "hi", name: "Hindi" },

  // Turkish
  tr: { code: "tr", name: "Turkish" },
  tur: { code: "tr", name: "Turkish" },
  turkish: { code: "tr", name: "Turkish" },
  "tr-tr": { code: "tr", name: "Turkish" },

  // Polish
  pl: { code: "pl", name: "Polish" },
  pol: { code: "pl", name: "Polish" },
  polish: { code: "pl", name: "Polish" },
  "pl-pl": { code: "pl", name: "Polish" },

  // Dutch
  nl: { code: "nl", name: "Dutch" },
  dut: { code: "nl", name: "Dutch" },
  nld: { code: "nl", name: "Dutch" },
  dutch: { code: "nl", name: "Dutch" },
  "nl-nl": { code: "nl", name: "Dutch" },

  // Swedish
  sv: { code: "sv", name: "Swedish" },
  swe: { code: "sv", name: "Swedish" },
  swedish: { code: "sv", name: "Swedish" },
  "sv-se": { code: "sv", name: "Swedish" },

  // Norwegian
  no: { code: "no", name: "Norwegian" },
  nor: { code: "no", name: "Norwegian" },
  norwegian: { code: "no", name: "Norwegian" },
  "no-no": { code: "no", name: "Norwegian" },

  // Danish
  da: { code: "da", name: "Danish" },
  dan: { code: "da", name: "Danish" },
  danish: { code: "da", name: "Danish" },
  "da-dk": { code: "da", name: "Danish" },

  // Finnish
  fi: { code: "fi", name: "Finnish" },
  fin: { code: "fi", name: "Finnish" },
  finnish: { code: "fi", name: "Finnish" },
  "fi-fi": { code: "fi", name: "Finnish" },

  // Greek
  el: { code: "el", name: "Greek" },
  gre: { code: "el", name: "Greek" },
  ell: { code: "el", name: "Greek" },
  greek: { code: "el", name: "Greek" },
  "el-gr": { code: "el", name: "Greek" },

  // Hebrew
  he: { code: "he", name: "Hebrew" },
  heb: { code: "he", name: "Hebrew" },
  hebrew: { code: "he", name: "Hebrew" },
  "he-il": { code: "he", name: "Hebrew" },

  // Thai
  th: { code: "th", name: "Thai" },
  tha: { code: "th", name: "Thai" },
  thai: { code: "th", name: "Thai" },
  "th-th": { code: "th", name: "Thai" },

  // Vietnamese
  vi: { code: "vi", name: "Vietnamese" },
  vie: { code: "vi", name: "Vietnamese" },
  vietnamese: { code: "vi", name: "Vietnamese" },
  "vi-vn": { code: "vi", name: "Vietnamese" },

  // Romanian
  ro: { code: "ro", name: "Romanian" },
  rum: { code: "ro", name: "Romanian" },
  ron: { code: "ro", name: "Romanian" },
  romanian: { code: "ro", name: "Romanian" },
  "ro-ro": { code: "ro", name: "Romanian" },

  // Basque
  eu: { code: "eu", name: "Basque" },
  baq: { code: "eu", name: "Basque" },
  eus: { code: "eu", name: "Basque" },
  basque: { code: "eu", name: "Basque" },

  // Catalan
  ca: { code: "ca", name: "Catalan" },
  cat: { code: "ca", name: "Catalan" },
  catalan: { code: "ca", name: "Catalan" },
  "ca-es": { code: "ca", name: "Catalan" },

  // Czech
  cs: { code: "cs", name: "Czech" },
  cze: { code: "cs", name: "Czech" },
  ces: { code: "cs", name: "Czech" },
  czech: { code: "cs", name: "Czech" },
  "cs-cz": { code: "cs", name: "Czech" },

  // Hungarian
  hu: { code: "hu", name: "Hungarian" },
  hun: { code: "hu", name: "Hungarian" },
  hungarian: { code: "hu", name: "Hungarian" },
  "hu-hu": { code: "hu", name: "Hungarian" },

  // Indonesian
  id: { code: "id", name: "Indonesian" },
  ind: { code: "id", name: "Indonesian" },
  indonesian: { code: "id", name: "Indonesian" },
  "id-id": { code: "id", name: "Indonesian" },

  // Malay
  ms: { code: "ms", name: "Malay" },
  may: { code: "ms", name: "Malay" },
  msa: { code: "ms", name: "Malay" },
  malay: { code: "ms", name: "Malay" },
  "ms-my": { code: "ms", name: "Malay" },

  // Ukrainian
  uk: { code: "uk", name: "Ukrainian" },
  ukr: { code: "uk", name: "Ukrainian" },
  ukrainian: { code: "uk", name: "Ukrainian" },
  "uk-ua": { code: "uk", name: "Ukrainian" },
};

/**
 * Detects language from various formats and returns standardized code and name
 * @param input - Language identifier (e.g., "fr", "fr-fr", "fre", "french")
 * @returns Object with ISO 639-1 code and language name, or null if not found
 * @example
 * detectLanguage("fr") // { code: "fr", name: "French" }
 * detectLanguage("fr-fr") // { code: "fr", name: "French" }
 * detectLanguage("fre") // { code: "fr", name: "French" }
 * detectLanguage("french") // { code: "fr", name: "French" }
 */
export function detectLanguage(input?: string | null): { code: string; name: string } | null {
  if (!input) return null;

  // Normalize input: lowercase, trim, remove dots
  const normalized = input.toLowerCase().trim().replace(/\./g, "");

  // Direct lookup
  const directMatch = LANGUAGE_MAP[normalized];
  if (directMatch) return directMatch;

  // Handle locale format (e.g., "fr-fr" -> "fr")
  const localeMatch = normalized.match(/^([a-z]{2,3})-?[a-z]{0,3}$/i);
  if (localeMatch) {
    const baseCode = localeMatch[1];
    const baseMatch = LANGUAGE_MAP[baseCode];
    if (baseMatch) return baseMatch;
  }

  // Try partial match for language names (e.g., "french" contains "french")
  for (const [key, value] of Object.entries(LANGUAGE_MAP)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value;
    }
  }

  // If no match found, return null
  return null;
}
