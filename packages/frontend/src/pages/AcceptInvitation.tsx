import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { AuthError } from '../services/auth.js';
import { acceptInvitation } from '../services/invitations.js';
import { CURRENT_USER_QUERY_KEY } from '../hooks/useAuth.js';

type TerminalState = 'already-used' | 'expired' | 'no-longer-valid' | 'invalid' | null;

export function AcceptInvitation() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [terminalState, setTerminalState] = useState<TerminalState>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    setGenericError(null);

    if (password !== confirm) {
      setValidationError(t('acceptInvitation.passwordMismatch'));
      return;
    }

    if (!token) {
      setTerminalState('invalid');
      return;
    }

    setIsPending(true);
    try {
      const user = await acceptInvitation(token, password);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.status === 410) {
          const msg = err.message.toLowerCase();
          if (msg.includes('already')) setTerminalState('already-used');
          else if (msg.includes('expired')) setTerminalState('expired');
          else setTerminalState('no-longer-valid');
        } else if (err.status === 404) {
          setTerminalState('invalid');
        } else if (err.status === 400) {
          setValidationError(t('acceptInvitation.weakPassword'));
        } else {
          setGenericError(t('acceptInvitation.errorGeneric'));
        }
      } else {
        setGenericError(t('acceptInvitation.errorGeneric'));
      }
    } finally {
      setIsPending(false);
    }
  }

  const terminalMessages: Record<NonNullable<TerminalState>, string> = {
    'already-used': t('acceptInvitation.alreadyUsed'),
    expired: t('acceptInvitation.expired'),
    'no-longer-valid': t('acceptInvitation.noLongerValid'),
    invalid: t('acceptInvitation.invalidLink'),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--color-muted] p-6">
      <main className="w-full max-w-sm">
        <div className="rounded-lg bg-background p-6 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold tracking-tight">{t('acceptInvitation.title')}</h1>

          {success && (
            <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <p className="font-semibold">{t('acceptInvitation.successTitle')}</p>
              <p>{t('acceptInvitation.successMessage')}</p>
            </div>
          )}

          {terminalState && (
            <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {terminalMessages[terminalState]}
            </div>
          )}

          {!success && !terminalState && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {genericError && (
                <p
                  role="alert"
                  className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {genericError}
                </p>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor="accept-password" className="text-sm font-medium">
                  {t('acceptInvitation.passwordLabel')}
                </label>
                <input
                  id="accept-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded border px-3 py-1.5 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="accept-confirm" className="text-sm font-medium">
                  {t('acceptInvitation.confirmPasswordLabel')}
                </label>
                <input
                  id="accept-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="rounded border px-3 py-1.5 text-sm"
                />
                {validationError && (
                  <p role="alert" className="text-sm text-red-600">
                    {validationError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="rounded bg-[--color-primary] px-3 py-1.5 text-sm font-medium text-[--color-primary-foreground] disabled:opacity-50"
              >
                {isPending ? t('acceptInvitation.submitting') : t('acceptInvitation.submitLabel')}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
