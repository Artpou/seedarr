import { type Messages, setupI18n } from "@lingui/core";
// @ts-expect-error - Compiled message files don't have type definitions
import { messages as enMessages } from "./locales/en/messages.mjs";
// @ts-expect-error - Compiled message files don't have type definitions
import { messages as frMessages } from "./locales/fr/messages.mjs";

export const LANGUAGE_TO_FULL_LOCALE = {
  en: "en-US",
  fr: "fr-FR",
} as const;

const allMessages: Record<string, Messages> = {
  en: enMessages,
  fr: frMessages,
};

/**
 * Create a new i18n instance for the given locale.
 * Used for SSR and client-side rendering.
 */
export function getI18nInstance(locale: string) {
  return setupI18n({
    locale,
    messages: { [locale]: allMessages[locale] || allMessages.en },
  });
}
