import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import {
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Paper,
  Title,
  Center,
} from '@mantine/core';
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
    <Center mih="100vh" bg="var(--mantine-color-gray-0)">
      <Paper withBorder shadow="md" p="xl" w={400} radius="md">
        <Title order={2} mb="lg" ta="center">
          {t('auth.signInTitle')}
        </Title>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {errorMessage() && (
              <Alert role="alert" color="red">
                {errorMessage()}
              </Alert>
            )}

            <TextInput
              id="email"
              label={t('auth.emailLabel')}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              id="password"
              label={t('auth.passwordLabel')}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" fullWidth loading={isPending}>
              {isPending ? t('auth.submitting') : t('auth.submitLabel')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
