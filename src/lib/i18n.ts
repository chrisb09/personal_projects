import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enCommon from '@/locales/en/common.json';
import enProjects from '@/locales/en/projects.json';
import deCommon from '@/locales/de/common.json';
import deProjects from '@/locales/de/projects.json';

const resources = {
  en: {
    common: enCommon,
    projects: enProjects,
  },
  de: {
    common: deCommon,
    projects: deProjects,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'de'],

    // Namespaces: 'common' for UI strings, 'projects' for project-specific texts
    ns: ['common', 'projects'],
    defaultNS: 'common',

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
      useSuspense: false,
    },
  });

export default i18n;
