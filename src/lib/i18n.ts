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

    // Language detection order: localStorage > cookie > browser navigator > fallback
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next',
      cookieMinutes: 525600, // 1 year
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false,
    },
  });

if (typeof document !== 'undefined') {
  if (i18n.language) {
    document.documentElement.lang = i18n.language.split('-')[0];
  }
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = (lng || 'en').split('-')[0];
  });
}

export default i18n;
