import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { AuthError } from '../services/auth';
import { useSignIn } from '../hooks/useAuth';

interface LocationState {
  from?: Location;
}

export function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: signIn, isPending, error } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const state = location.state as LocationState | null;
    const redirectTo = state?.from?.pathname ?? '/';
    signIn(
      { email: email.trim(), password },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    );
  }

  function errorMessage(): string | null {
    if (!error) return null;
    if (error instanceof AuthError) {
      if (error.status === 423) return t('auth.errorLocked');
      if (error.status === 401) return t('auth.errorInvalidCredentials');
    }
    return t('auth.errorGeneric');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--color-muted] p-6">
      <main className="w-full max-w-sm">
        <div className="rounded-lg bg-background p-6 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold tracking-tight">{t('auth.signInTitle')}</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMessage() && (
              <p
                role="alert"
                className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {errorMessage()}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium">
                {t('auth.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded border px-3 py-1.5 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium">
                {t('auth.passwordLabel')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded border px-3 py-1.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-[--color-primary] px-3 py-1.5 text-sm font-medium text-[--color-primary-foreground] disabled:opacity-50"
            >
              {isPending ? t('auth.submitting') : t('auth.submitLabel')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
