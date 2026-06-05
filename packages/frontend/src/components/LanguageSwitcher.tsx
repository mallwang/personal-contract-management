import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const;

type LangCode = (typeof LANGUAGES)[number]['code'];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as LangCode;

  function handleSelect(code: LangCode) {
    void i18n.changeLanguage(code);
    localStorage.setItem('pcm-lang', code);
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleSelect(code)}
          aria-label={label}
          aria-pressed={current === code}
          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            current === code
              ? 'bg-foreground text-background'
              : 'text-[--color-muted-foreground] hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
