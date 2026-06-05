import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';

const SUPPORTED_LANGS = ['en', 'de'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

function isSupportedLang(value: string | null): value is SupportedLang {
  return value !== null && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

const stored = localStorage.getItem('pcm-lang');
const lng: SupportedLang = isSupportedLang(stored) ? stored : 'en';

i18next.use(initReactI18next).init({
  lng,
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  interpolation: { escapeValue: false },
});

export default i18next;
