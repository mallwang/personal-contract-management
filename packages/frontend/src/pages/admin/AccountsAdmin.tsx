import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Account, Role } from '@pcm/shared';
import { AuthError } from '../../services/auth.js';
import {
  useAccounts,
  useCreateAccount,
  useArchiveAccount,
  useReactivateAccount,
  useChangeAccountRole,
} from '../../hooks/useAccounts.js';

export function AccountsAdmin() {
  const { t } = useTranslation();
  const { data: accounts, isLoading, isError } = useAccounts();
  const { mutate: createAccount, isPending: isCreating, error: createError } = useCreateAccount();
  const { mutate: archiveAccount, error: archiveError } = useArchiveAccount();
  const { mutate: reactivateAccount, error: reactivateError } = useReactivateAccount();
  const { mutate: changeRole, error: roleError } = useChangeAccountRole();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [initialPassword, setInitialPassword] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateSuccess(false);
    createAccount(
      { email: email.trim(), displayName: displayName.trim(), role, initialPassword },
      {
        onSuccess: () => {
          setEmail('');
          setDisplayName('');
          setRole('MEMBER');
          setInitialPassword('');
          setCreateSuccess(true);
        },
      },
    );
  }

  function actionErrorMessage(error: unknown): string | null {
    if (!error) return null;
    if (error instanceof AuthError) {
      if (error.status === 409 && error.message.toLowerCase().includes('administrator')) {
        return t('accountsAdmin.lastAdminError');
      }
    }
    return t('accountsAdmin.actionError');
  }

  function createErrorMessage(): string | null {
    if (!createError) return null;
    if (createError instanceof AuthError && createError.status === 409) {
      return t('accountsAdmin.duplicateEmailError');
    }
    return t('accountsAdmin.createError');
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

        <div className="mb-6 rounded-lg bg-background p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">{t('accountsAdmin.newAccountTitle')}</h2>
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            {createErrorMessage() && (
              <p
                role="alert"
                className="w-full rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {createErrorMessage()}
              </p>
            )}
            {createSuccess && !createError && (
              <p
                role="status"
                className="w-full rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700"
              >
                {t('accountsAdmin.createSuccess')}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="new-account-email" className="text-sm font-medium">
                {t('accountsAdmin.emailLabel')}
              </label>
              <input
                id="new-account-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded border px-3 py-1.5 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-account-display-name" className="text-sm font-medium">
                {t('accountsAdmin.displayNameLabel')}
              </label>
              <input
                id="new-account-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded border px-3 py-1.5 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-account-role" className="text-sm font-medium">
                {t('accountsAdmin.roleLabel')}
              </label>
              <select
                id="new-account-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="rounded border px-3 py-1.5 text-sm"
              >
                <option value="MEMBER">{t('accountsAdmin.roleMember')}</option>
                <option value="ADMIN">{t('accountsAdmin.roleAdmin')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-account-password" className="text-sm font-medium">
                {t('accountsAdmin.initialPasswordLabel')}
              </label>
              <input
                id="new-account-password"
                type="password"
                required
                minLength={8}
                value={initialPassword}
                onChange={(e) => setInitialPassword(e.target.value)}
                className="rounded border px-3 py-1.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="rounded bg-[--color-primary] px-4 py-2 text-sm font-medium text-[--color-primary-foreground] disabled:opacity-50"
            >
              {isCreating ? t('accountsAdmin.creating') : t('accountsAdmin.createButton')}
            </button>
          </form>
        </div>

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
