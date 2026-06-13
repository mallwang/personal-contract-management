import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Center, Paper, Title, Stack, PasswordInput, Button, Alert, Text } from '@mantine/core';
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
    <Center mih="100vh" bg="var(--mantine-color-gray-0)">
      <Paper withBorder shadow="md" p="xl" w={400} radius="md">
        <Title order={2} mb="lg" ta="center">
          {t('acceptInvitation.title')}
        </Title>

        {success && (
          <Alert color="green" mb="md">
            <Text fw={600}>{t('acceptInvitation.successTitle')}</Text>
            <Text size="sm">{t('acceptInvitation.successMessage')}</Text>
          </Alert>
        )}

        {terminalState && (
          <Alert color="yellow" mb="md">
            {terminalMessages[terminalState]}
          </Alert>
        )}

        {!success && !terminalState && (
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {genericError && (
                <Alert role="alert" color="red">
                  {genericError}
                </Alert>
              )}

              <PasswordInput
                id="accept-password"
                label={t('acceptInvitation.passwordLabel')}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={validationError}
              />

              <PasswordInput
                id="accept-confirm"
                label={t('acceptInvitation.confirmPasswordLabel')}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              <Button type="submit" fullWidth loading={isPending}>
                {isPending ? t('acceptInvitation.submitting') : t('acceptInvitation.submitLabel')}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Center>
  );
}
