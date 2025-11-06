import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'tr'; // Force Turkish default
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    console.log('[Language] Current language:', language);
  }, [language]);

  const t = (key) => {
    try {
      const translation = translations[language]?.[key] || translations['tr']?.[key] || key;
      return translation;
    } catch (error) {
      console.error('[Language] Translation error for key:', key, error);
      return key;
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const newLang = prev === 'tr' ? 'en' : 'tr';
      console.log('[Language] Toggling to:', newLang);
      return newLang;
    });
  };

  const value = {
    language,
    setLanguage,
    t,
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
