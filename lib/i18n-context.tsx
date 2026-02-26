'use client';

import { createContext, useContext, useState, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { 
  type Locale, 
  defaultLocale, 
  translations, 
  type TranslationKey 
} from '@/lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, ...args: unknown[]) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('locale');
  if (stored === 'en' || stored === 'zh') return stored;
  return null;
}

function getInitialLocale(): Locale {
  const storedLocale = getStoredLocale();
  return storedLocale || getBrowserLocale();
}

// Subscribe to locale changes (for SSR compatibility)
function subscribeToLocale(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): Locale {
  return getInitialLocale();
}

function getServerSnapshot(): Locale {
  return defaultLocale;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const initialLocale = useSyncExternalStore(subscribeToLocale, getSnapshot, getServerSnapshot);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback((key: TranslationKey, ...args: unknown[]): string => {
    const translation = translations[locale][key];
    if (typeof translation === 'function') {
      return (translation as (...args: unknown[]) => string)(...args);
    }
    return translation as string;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
