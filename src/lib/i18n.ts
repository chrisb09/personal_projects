import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en'],

    // Namespaces: 'common' for UI strings, 'projects' for project-specific texts
    ns: ['common', 'projects'],
    defaultNS: 'common',

    // Load translations from public/locales/{lang}/{ns}.json
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },

    // Language detection order: cookie > browser navigator > fallback
    detection: {
      order: ['cookie', 'navigator'],
      caches: ['cookie'],
      cookieMinutes: 525600, // 1 year
      lookupCookie: 'i18next',
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
