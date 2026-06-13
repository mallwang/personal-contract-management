import { useTranslation } from 'react-i18next';
import classes from './LanguageSwitcher.module.css';

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
    <div className={classes.root} role="group" aria-label="Language">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => handleSelect(code)}
          aria-label={label}
          aria-pressed={current === code}
          className={`${classes.langButton} ${current === code ? classes.langButtonActive : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
