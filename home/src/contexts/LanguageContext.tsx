import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "ar" | "en" | "fr" | "es" | "ru" | "id" | "ms";

type TranslationObject = {
  ar: string;
  en: string;
  fr: string;
  es: string;
  ru: string;
  id: string;
  ms: string;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (translations: Partial<TranslationObject> | string, en?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const languageNames: Record<Language, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
  es: "Español",
  ru: "Русский",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ar");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (translations: Partial<TranslationObject> | string, en?: string): string => {
    if (typeof translations === "string") {
      // Old format: t('ar text', 'en text')
      return language === "ar" ? translations : en || translations;
    }
    // New format: t({ ar: 'ar text', en: 'en text', ... })
    return translations[language] || translations.en || translations.ar || "";
  };

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export const languages: Language[] = ["ar", "en", "fr", "es", "ru", "id", "ms"];
export { languageNames };
export type { Language };
