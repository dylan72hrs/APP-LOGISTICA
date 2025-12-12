'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

import en from '@/lib/locales/en.json';
import es from '@/lib/locales/es.json';
import fr from '@/lib/locales/fr.json';

type Language = 'en' | 'es' | 'fr';

const translations: Record<Language, any> = { en, es, fr };

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language | null;
    if (storedLang && ['en', 'es', 'fr'].includes(storedLang)) {
      setLanguageState(storedLang);
    } else {
        const browserLang = navigator.language.split('-')[0] as Language;
        if (['en', 'es', 'fr'].includes(browserLang)) {
            setLanguageState(browserLang);
        } else {
            setLanguageState('es'); // default
        }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    let translation = translations[language][key] || translations['es'][key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{{${rKey}}}`, replacements[rKey]);
      });
    }
    return translation;
  }, [language]);


  const value = { language, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
