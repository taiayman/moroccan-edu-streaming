import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationAR from './locales/ar/translation.json';
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';

const resources = {
  ar: {
    translation: translationAR
  },
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  }
};

const getLanguageFromPath = () => {
  const path = window.location.pathname;
  const match = path.match(/^\/(ar|en|fr)\//);
  return match ? match[1] : 'ar';
};

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'ar',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['ar', 'en', 'fr'],
    lng: getLanguageFromPath(),
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      checkWhitelist: true
    },
    react: {
      useSuspense: false,
      wait: true
    },
    load: 'languageOnly',
    ns: ['translation'],
    defaultNS: 'translation'
  });

i18n.on('languageChanged', (lng) => {
  const currentPath = window.location.pathname;
  const newPath = currentPath.replace(/^\/(ar|en|fr)\//, `/${lng}/`);
  if (currentPath !== newPath) {
    window.location.pathname = newPath;
  }
});

export const useTranslationsReady = () => {
  return i18n.isInitialized && i18n.hasResourceBundle(i18n.language, 'translation');
};

export const getCurrentLanguage = () => {
  return getLanguageFromPath();
};

export default i18n;
