import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  if (isExpired)
    return (
      <span className="text-[--color-muted-foreground]">{t('accountsAdmin.statusExpired')}</span>
    );
  const map: Record<string, string> = {
    PENDING: t('accountsAdmin.statusPending'),
    ACCEPTED: t('accountsAdmin.statusAccepted'),
    CANCELLED: t('accountsAdmin.statusCancelled'),
    SUPERSEDED: t('accountsAdmin.statusSuperseded'),
  };
  return <span>{map[invitation.status] ?? invitation.status}</span>;
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
    <div className="mb-6 rounded-lg bg-background p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{t('accountsAdmin.inviteTitle')}</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        {errorMessage() && (
          <p
            role="alert"
            className="w-full rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {errorMessage()}
          </p>
        )}
        {success && !error && (
          <p
            role="status"
            className="w-full rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {t('accountsAdmin.inviteSuccess')}
          </p>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="invite-email" className="text-sm font-medium">
            {t('accountsAdmin.emailLabel')}
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-[--color-primary] px-4 py-2 text-sm font-medium text-[--color-primary-foreground] disabled:opacity-50"
        >
          {isPending ? t('accountsAdmin.inviting') : t('accountsAdmin.inviteButton')}
        </button>
      </form>
    </div>
  );
}

function InvitationsTable() {
  const { t } = useTranslation();
  const { data: invitations, isLoading } = useInvitations();
  const { mutate: cancelInvitation } = useCancelInvitation();
  const { mutate: resendInvitation } = useResendInvitation();

  if (isLoading)
    return (
      <p className="py-4 text-center text-[--color-muted-foreground]">{t('common.loading')}</p>
    );
  if (!invitations || invitations.length === 0) {
    return (
      <p className="py-4 text-sm text-[--color-muted-foreground]">
        {t('accountsAdmin.noInvitations')}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-background p-4 shadow-sm mb-6">
      <h2 className="mb-3 text-lg font-semibold">{t('accountsAdmin.pendingInvitationsTitle')}</h2>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-[--color-muted-foreground]">
            <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnEmail')}</th>
            <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnInvitationStatus')}</th>
            <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnSentAt')}</th>
            <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnDate')}</th>
            <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnActions')}</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => {
            const isPending = inv.status === 'PENDING';
            const isExpired = isPending && new Date(inv.expiresAt) < new Date();
            const canAct = isPending && !isExpired;
            return (
              <tr key={inv.token} className="border-b last:border-0">
                <td className="py-2 pr-4">{inv.email}</td>
                <td className="py-2 pr-4">
                  <InvitationStatusBadge invitation={inv} />
                </td>
                <td className="py-2 pr-4">{localeDate(inv.createdAt)}</td>
                <td className="py-2 pr-4">
                  {inv.status === 'ACCEPTED' && inv.acceptedAt
                    ? `${t('accountsAdmin.acceptedOn')} ${localeDate(inv.acceptedAt)}`
                    : inv.status === 'CANCELLED' && inv.cancelledAt
                      ? `${t('accountsAdmin.withdrawnOn')} ${localeDate(inv.cancelledAt)}`
                      : `${t('accountsAdmin.expiresOn')} ${localeDate(inv.expiresAt)}`}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex flex-wrap gap-2">
                    {canAct && (
                      <>
                        <button
                          type="button"
                          onClick={() => resendInvitation(inv.token)}
                          className="rounded border px-2 py-1 text-xs hover:bg-foreground/5"
                        >
                          {t('accountsAdmin.resendInviteButton')}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelInvitation(inv.token)}
                          className="rounded border px-2 py-1 text-xs hover:bg-foreground/5"
                        >
                          {t('accountsAdmin.cancelInviteButton')}
                        </button>
                      </>
                    )}
                    {isExpired && (
                      <button
                        type="button"
                        onClick={() => resendInvitation(inv.token)}
                        className="rounded border px-2 py-1 text-xs hover:bg-foreground/5"
                      >
                        {t('accountsAdmin.resendInviteButton')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
      if (error.status === 409 && error.message.toLowerCase().includes('administrator')) {
        return t('accountsAdmin.lastAdminError');
      }
    }
    return t('accountsAdmin.actionError');
  }

  function otherActiveAdminExists(account: Account): boolean {
    if (!accounts) return false;
    return accounts.some((a) => a.id !== account.id && a.role === 'ADMIN' && a.status === 'ACTIVE');
  }

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('accountsAdmin.title')}</h1>
          <p className="text-sm text-[--color-muted-foreground]">
            <Link to="/" className="hover:underline">
              {t('nav.backToDashboard')}
            </Link>
          </p>
          <p className="mt-2 text-sm text-[--color-muted-foreground]">
            {t('accountsAdmin.subtitle')}
          </p>
        </header>

        <InviteForm />
        <InvitationsTable />

        {(archiveError || reactivateError || roleError) && (
          <p
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {actionErrorMessage(archiveError ?? reactivateError ?? roleError)}
          </p>
        )}

        {isLoading && (
          <p className="py-8 text-center text-[--color-muted-foreground]">{t('common.loading')}</p>
        )}

        {isError && <p className="py-8 text-center text-red-600">{t('accountsAdmin.loadError')}</p>}

        {accounts && (
          <div className="overflow-x-auto rounded-lg bg-background p-4 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[--color-muted-foreground]">
                  <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnName')}</th>
                  <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnEmail')}</th>
                  <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnRole')}</th>
                  <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnStatus')}</th>
                  <th className="py-2 pr-4 font-medium">{t('accountsAdmin.columnActions')}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const canChangeRoleOrArchive =
                    account.role !== 'ADMIN' || otherActiveAdminExists(account);
                  return (
                    <tr key={account.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{account.displayName}</td>
                      <td className="py-2 pr-4">{account.email}</td>
                      <td className="py-2 pr-4">
                        {account.role === 'ADMIN'
                          ? t('accountsAdmin.roleAdmin')
                          : t('accountsAdmin.roleMember')}
                      </td>
                      <td className="py-2 pr-4">
                        {account.status === 'ACTIVE'
                          ? t('accountsAdmin.statusActive')
                          : t('accountsAdmin.statusArchived')}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-2">
                          {account.status === 'ACTIVE' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => archiveAccount(account.id)}
                                disabled={account.role === 'ADMIN' && !canChangeRoleOrArchive}
                                className="rounded border px-2 py-1 text-xs hover:bg-foreground/5 disabled:opacity-50"
                              >
                                {t('accountsAdmin.archiveButton')}
                              </button>
                              {account.role === 'ADMIN' ? (
                                <button
                                  type="button"
                                  onClick={() => changeRole({ id: account.id, role: 'MEMBER' })}
                                  disabled={!canChangeRoleOrArchive}
                                  className="rounded border px-2 py-1 text-xs hover:bg-foreground/5 disabled:opacity-50"
                                >
                                  {t('accountsAdmin.makeMemberButton')}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => changeRole({ id: account.id, role: 'ADMIN' })}
                                  className="rounded border px-2 py-1 text-xs hover:bg-foreground/5"
                                >
                                  {t('accountsAdmin.makeAdminButton')}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => reactivateAccount(account.id)}
                              className="rounded border px-2 py-1 text-xs hover:bg-foreground/5"
                            >
                              {t('accountsAdmin.reactivateButton')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
