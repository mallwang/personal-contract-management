import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { AuthError, changePassword } from '../services/auth.js';

export function AccountSettings() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: changePassword,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setSuccess(true);
        },
      },
    );
  }

  function errorMessage(): string | null {
    if (!error) return null;
    if (error instanceof AuthError && error.status === 401) {
      return t('accountSettings.errorInvalidCurrent');
    }
    return t('accountSettings.errorGeneric');
  }

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('accountSettings.title')}</h1>
          <p className="text-sm text-[--color-muted-foreground]">
            <Link to="/" className="hover:underline">
              {t('nav.backToDashboard')}
            </Link>
          </p>
        </header>

        <div className="rounded-lg bg-background p-6 shadow-sm">
          <p className="mb-4 text-sm text-[--color-muted-foreground]">
            {t('accountSettings.subtitle')}
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMessage() && (
              <p
                role="alert"
                className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {errorMessage()}
              </p>
            )}
            {success && !error && (
              <p
                role="status"
                className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700"
              >
                {t('accountSettings.success')}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="current-password" className="text-sm font-medium">
                {t('accountSettings.currentPasswordLabel')}
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded border px-3 py-1.5 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-password" className="text-sm font-medium">
                {t('accountSettings.newPasswordLabel')}
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded border px-3 py-1.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-[--color-primary] px-3 py-1.5 text-sm font-medium text-[--color-primary-foreground] disabled:opacity-50"
            >
              {isPending ? t('accountSettings.submitting') : t('accountSettings.submitLabel')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
