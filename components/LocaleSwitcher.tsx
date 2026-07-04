"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export default function LocaleSwitcher({
  locale,
  variant = "sidebar",
}: {
  locale: Locale;
  variant?: "sidebar" | "standalone";
}) {
  const router = useRouter();

  function handleChange(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className={`locale-switcher ${variant === "standalone" ? "locale-switcher-standalone" : ""}`}>
      <button
        className={locale === "fr" ? "active" : ""}
        onClick={() => handleChange("fr")}
        aria-label="Français"
      >
        FR
      </button>
      <button
        className={locale === "en" ? "active" : ""}
        onClick={() => handleChange("en")}
        aria-label="English"
      >
        EN
      </button>
      <button
        className={locale === "ar" ? "active" : ""}
        onClick={() => handleChange("ar")}
        aria-label="العربية"
      >
        عربي
      </button>
    </div>
  );
}
