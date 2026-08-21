import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import translations from './translations';

export type Lang = 'en' | 'hi';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('railsaathi_lang');
    return stored === 'hi' || stored === 'en' ? stored : 'en';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('railsaathi_lang', l);
  }, []);

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry.en ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
