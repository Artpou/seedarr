"use client";

import { type Messages, setupI18n } from "@lingui/core";
import { detect, fromNavigator, fromStorage } from "@lingui/detect-locale";
import { I18nProvider } from "@lingui/react";
import { useEffect, useState } from "react";

const LANGUAGE_TO_FULL_LOCALE = {
  en: "en-US",
  fr: "fr-FR",
} as const;

export function LinguiClientProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: React.ReactNode;
  initialLocale: string;
  initialMessages: Messages;
}) {
  const [i18n] = useState(() => {
    return setupI18n({
      locale: initialLocale,
      messages: { [initialLocale]: initialMessages },
    });
  });

  // Detect and activate user's preferred locale after hydration
  useEffect(() => {
    const detectedLocale = detect(fromStorage("locale"), fromNavigator(), () => "en-US");
    const baseLocale = detectedLocale?.split("-")[0] || "en";
    const availableLocales = Object.keys(LANGUAGE_TO_FULL_LOCALE);
    const userLocale = availableLocales.includes(baseLocale) ? baseLocale : "en";

    // Only activate if different from initial locale
    if (i18n.locale !== userLocale) {
      // Load messages for the detected locale if not already loaded
      if (!i18n.messages[userLocale]) {
        import(`../locales/${userLocale}/messages.mjs`).then((module) => {
          i18n.load({ [userLocale]: module.messages });
          i18n.activate(userLocale);
        });
      } else {
        i18n.activate(userLocale);
      }
    }
  }, [i18n]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
