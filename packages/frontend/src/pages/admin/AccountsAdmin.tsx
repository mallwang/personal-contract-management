import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Title,
  Text,
  Paper,
  Table,
  Avatar,
  Badge,
  Group,
  Button,
  Alert,
  TextInput,
  Center,
} from '@mantine/core';
import type { Account, Invitation } from '@pcm/shared';
import { AuthError } from '../../services/auth.js';
import {
  useAccounts,
  useArchiveAccount,
  useReactivateAccount,
  useChangeAccountRole,
} from '../../hooks/useAccounts.js';
import {
  useInvitations,
  useSendInvitation,
  useCancelInvitation,
  useResendInvitation,
} from '../../hooks/useInvitations.js';

function localeDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function InvitationStatusBadge({ invitation }: { invitation: Invitation }) {
  const { t } = useTranslation();
  const isExpired = invitation.status === 'PENDING' && new Date(invitation.expiresAt) < new Date();
  if (isExpired) return <Badge color="gray">{t('accountsAdmin.statusExpired')}</Badge>;
  const config: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'yellow', label: t('accountsAdmin.statusPending') },
    ACCEPTED: { color: 'green', label: t('accountsAdmin.statusAccepted') },
    CANCELLED: { color: 'gray', label: t('accountsAdmin.statusCancelled') },
    SUPERSEDED: { color: 'gray', label: t('accountsAdmin.statusSuperseded') },
  };
  const c = config[invitation.status];
  if (!c) return <span>{invitation.status}</span>;
  return <Badge color={c.color}>{c.label}</Badge>;
}

function InviteForm() {
  const { t } = useTranslation();
  const { mutate: sendInvitation, isPending, error } = useSendInvitation();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    sendInvitation(
      { email: email.trim() },
      {
        onSuccess: () => {
          setEmail('');
          setSuccess(true);
        },
      },
    );
  }

  function errorMessage(): string | null {
    if (!error) return null;
    if (error instanceof AuthError) {
      if (error.status === 409) return t('accountsAdmin.duplicateEmailError');
      if (error.status === 502) return t('accountsAdmin.mailerError');
    }
    return t('accountsAdmin.inviteError');
  }

  return (
    <Paper withBorder p="md">
      <Text fw={600} mb="sm">
        {t('accountsAdmin.inviteTitle')}
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          {errorMessage() && (
            <Alert role="alert" color="red">
              {errorMessage()}
            </Alert>
          )}
          {success && !error && (
            <Alert role="status" color="green">
              {t('accountsAdmin.inviteSuccess')}
            </Alert>
          )}
          <Group align="flex-end" gap="sm">
            <TextInput
              id="invite-email"
              label={t('accountsAdmin.emailLabel')}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" loading={isPending}>
              {isPending ? t('accountsAdmin.inviting') : t('accountsAdmin.inviteButton')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

function InvitationsTable() {
  const { t } = useTranslation();
  const { data: invitations, isLoading } = useInvitations();
  const { mutate: cancelInvitation } = useCancelInvitation();
  const { mutate: resendInvitation } = useResendInvitation();

  if (isLoading)
    return (
      <Center py="md">
        <Text c="dimmed">{t('common.loading')}</Text>
      </Center>
    );
  if (!invitations || invitations.length === 0) {
    return (
      <Text size="sm" c="dimmed" py="sm">
        {t('accountsAdmin.noInvitations')}
      </Text>
    );
  }

  return (
    <Paper withBorder>
      <Text fw={600} p="md" pb={0}>
        {t('accountsAdmin.pendingInvitationsTitle')}
      </Text>
      <Table.ScrollContainer minWidth={600}>
        <Table withTableBorder={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('accountsAdmin.columnEmail')}</Table.Th>
              <Table.Th>{t('accountsAdmin.columnInvitationStatus')}</Table.Th>
              <Table.Th>{t('accountsAdmin.columnSentAt')}</Table.Th>
              <Table.Th>{t('accountsAdmin.columnDate')}</Table.Th>
              <Table.Th>{t('accountsAdmin.columnActions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {invitations.map((inv) => {
              const isPending = inv.status === 'PENDING';
              const isExpired = isPending && new Date(inv.expiresAt) < new Date();
              const canAct = isPending && !isExpired;
              return (
                <Table.Tr key={inv.token}>
                  <Table.Td>{inv.email}</Table.Td>
                  <Table.Td>
                    <InvitationStatusBadge invitation={inv} />
                  </Table.Td>
                  <Table.Td>{localeDate(inv.createdAt)}</Table.Td>
                  <Table.Td>
                    {inv.status === 'ACCEPTED' && inv.acceptedAt
                      ? `${t('accountsAdmin.acceptedOn')} ${localeDate(inv.acceptedAt)}`
                      : inv.status === 'CANCELLED' && inv.cancelledAt
                        ? `${t('accountsAdmin.withdrawnOn')} ${localeDate(inv.cancelledAt)}`
                        : `${t('accountsAdmin.expiresOn')} ${localeDate(inv.expiresAt)}`}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {(canAct || isExpired) && (
                        <Button
                          size="compact-sm"
                          variant="default"
                          onClick={() => resendInvitation(inv.token)}
                        >
                          {t('accountsAdmin.resendInviteButton')}
                        </Button>
                      )}
                      {canAct && (
                        <Button
                          size="compact-sm"
                          variant="default"
                          color="red"
                          onClick={() => cancelInvitation(inv.token)}
                        >
                          {t('accountsAdmin.cancelInviteButton')}
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}

export function AccountsAdmin() {
  const { t } = useTranslation();
  const { data: accounts, isLoading, isError } = useAccounts();
  const { mutate: archiveAccount, error: archiveError } = useArchiveAccount();
  const { mutate: reactivateAccount, error: reactivateError } = useReactivateAccount();
  const { mutate: changeRole, error: roleError } = useChangeAccountRole();

  function actionErrorMessage(error: unknown): string | null {
    if (!error) return null;
    if (error instanceof AuthError) {
      if (error.status === 409 && (error.message ?? '').toLowerCase().includes('administrator')) {
        return t('accountsAdmin.lastAdminError');
      }
    }
    return t('accountsAdmin.actionError');
  }

  function otherActiveAdminExists(account: Account): boolean {
    if (!accounts) return false;
    return accounts.some((a) => a.id !== account.id && a.role === 'ADMIN' && a.status === 'ACTIVE');
  }

  function userInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t('accountsAdmin.title')}</Title>
        <Text size="sm" c="dimmed">
          {t('accountsAdmin.subtitle')}
        </Text>
      </div>

      <InviteForm />
      <InvitationsTable />

      {(archiveError || reactivateError || roleError) && (
        <Alert role="alert" color="red">
          {actionErrorMessage(archiveError ?? reactivateError ?? roleError)}
        </Alert>
      )}

      {isLoading && (
        <Center py="xl">
          <Text c="dimmed">{t('common.loading')}</Text>
        </Center>
      )}
      {isError && <Alert color="red">{t('accountsAdmin.loadError')}</Alert>}

      {accounts && (
        <Paper withBorder>
          <Table.ScrollContainer minWidth={500}>
            <Table withTableBorder={false} highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('accountsAdmin.columnName')}</Table.Th>
                  <Table.Th>{t('accountsAdmin.columnEmail')}</Table.Th>
                  <Table.Th>{t('accountsAdmin.columnRole')}</Table.Th>
                  <Table.Th>{t('accountsAdmin.columnStatus')}</Table.Th>
                  <Table.Th>{t('accountsAdmin.columnActions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {accounts.map((account) => {
                  const canChangeRoleOrArchive =
                    account.role !== 'ADMIN' || otherActiveAdminExists(account);
                  return (
                    <Table.Tr key={account.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size={32} radius="xl" color="blue">
                            {userInitials(account.displayName)}
                          </Avatar>
                          <Text size="sm" fw={500}>
                            {account.displayName}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {account.email}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={account.role === 'ADMIN' ? 'blue' : 'gray'} variant="light">
                          {account.role === 'ADMIN'
                            ? t('accountsAdmin.roleAdmin')
                            : t('accountsAdmin.roleMember')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={account.status === 'ACTIVE' ? 'green' : 'gray'}
                          variant="light"
                        >
                          {account.status === 'ACTIVE'
                            ? t('accountsAdmin.statusActive')
                            : t('accountsAdmin.statusArchived')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {account.status === 'ACTIVE' ? (
                            <>
                              <Button
                                size="compact-sm"
                                variant="default"
                                onClick={() => archiveAccount(account.id)}
                                disabled={account.role === 'ADMIN' && !canChangeRoleOrArchive}
                              >
                                {t('accountsAdmin.archiveButton')}
                              </Button>
                              {account.role === 'ADMIN' ? (
                                <Button
                                  size="compact-sm"
                                  variant="default"
                                  onClick={() => changeRole({ id: account.id, role: 'MEMBER' })}
                                  disabled={!canChangeRoleOrArchive}
                                >
                                  {t('accountsAdmin.makeMemberButton')}
                                </Button>
                              ) : (
                                <Button
                                  size="compact-sm"
                                  variant="default"
                                  onClick={() => changeRole({ id: account.id, role: 'ADMIN' })}
                                >
                                  {t('accountsAdmin.makeAdminButton')}
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              size="compact-sm"
                              variant="default"
                              onClick={() => reactivateAccount(account.id)}
                            >
                              {t('accountsAdmin.reactivateButton')}
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}
    </Stack>
  );
}
