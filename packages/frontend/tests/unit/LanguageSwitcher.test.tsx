import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher.js';

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    localStorage.clear();
  });

  it('renders buttons or options for both English and German', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText(/English|EN/i)).toBeInTheDocument();
    expect(screen.getByText(/Deutsch|DE/i)).toBeInTheDocument();
  });

  it('calls i18next.changeLanguage with "de" when German is selected', async () => {
    const changeSpy = vi.spyOn(i18n, 'changeLanguage');
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByText(/Deutsch|DE/i));
    expect(changeSpy).toHaveBeenCalledWith('de');
    changeSpy.mockRestore();
  });

  it('writes selected language code to localStorage when German is selected', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByText(/Deutsch|DE/i));
    expect(localStorage.getItem('pcm-lang')).toBe('de');
  });

  it('writes selected language code to localStorage when English is selected', async () => {
    await i18n.changeLanguage('de');
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByText(/English|EN/i));
    expect(localStorage.getItem('pcm-lang')).toBe('en');
  });

  it('calls i18next.changeLanguage with "en" when English is selected', async () => {
    await i18n.changeLanguage('de');
    const changeSpy = vi.spyOn(i18n, 'changeLanguage');
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByText(/English|EN/i));
    expect(changeSpy).toHaveBeenCalledWith('en');
    changeSpy.mockRestore();
  });
});
