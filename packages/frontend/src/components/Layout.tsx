import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import { useCurrentUser, useSignOut } from '../hooks/useAuth.js';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const { mutate: signOut, isPending } = useSignOut();

  return (
    <>
      <div className="fixed right-4 top-3 z-50 flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-sm shadow-sm">
            <span className="font-medium">{user.displayName}</span>
            <Link
              to="/account"
              className="rounded border px-2 py-1 text-xs text-[--color-muted-foreground] hover:bg-[--color-muted]"
            >
              {t('nav.myAccount')}
            </Link>
            {user.role === 'ADMIN' && (
              <Link
                to="/admin/accounts"
                className="rounded border px-2 py-1 text-xs text-[--color-muted-foreground] hover:bg-[--color-muted]"
              >
                {t('nav.accounts')}
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut()}
              disabled={isPending}
              className="rounded border px-2 py-1 text-xs text-[--color-muted-foreground] hover:bg-[--color-muted] disabled:opacity-50"
            >
              {isPending ? t('auth.signingOut') : t('auth.signOut')}
            </button>
          </div>
        )}
        <LanguageSwitcher />
      </div>
      {children}
    </>
  );
}
