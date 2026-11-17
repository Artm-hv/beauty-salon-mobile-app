import React, { createContext, useContext, useState, useEffect } from 'react';
import { Colors, LightColors, ThemeColors } from '../constants/colors';
import { Language, translations } from '../constants/i18n';

interface AppSettingsContextType {
  language: Language;
  isDark: boolean;
  colors: ThemeColors;
  t: typeof translations['pl'];
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  setIsDark: (val: boolean) => void;
}

const STORAGE_LANG_KEY = 'svoya_app_language';
const STORAGE_THEME_KEY = 'svoya_app_theme';

const AppSettingsContext = createContext<AppSettingsContextType>({
  language: 'pl',
  isDark: true,
  colors: Colors,
  t: translations.pl,
  setLanguage: () => {},
  toggleTheme: () => {},
  setIsDark: () => {},
});

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // За замовчуванням базова мова польська ('pl') та темна тема
  const [language, setLanguageState] = useState<Language>('pl');
  const [isDark, setIsDarkState] = useState<boolean>(true);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedLang = window.localStorage.getItem(STORAGE_LANG_KEY) as Language | null;
        if (savedLang === 'pl' || savedLang === 'ua') {
          setLanguageState(savedLang);
        } else {
          // Встановлюємо польську за замовчуванням при першому вході
          window.localStorage.setItem(STORAGE_LANG_KEY, 'pl');
          setLanguageState('pl');
        }

        const savedTheme = window.localStorage.getItem(STORAGE_THEME_KEY);
        if (savedTheme !== null) {
          setIsDarkState(savedTheme === 'dark');
        }
      }
    } catch {
      // Fallback: мова залишається 'pl', тема 'dark'
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_LANG_KEY, lang);
      }
    } catch {}
  };

  const setIsDark = (val: boolean) => {
    setIsDarkState(val);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_THEME_KEY, val ? 'dark' : 'light');
      }
    } catch {}
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const colors = isDark ? Colors : LightColors;
  const t = translations[language];

  return (
    <AppSettingsContext.Provider
      value={{
        language,
        isDark,
        colors,
        t,
        setLanguage,
        toggleTheme,
        setIsDark,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);
