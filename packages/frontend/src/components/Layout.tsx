import type { ReactNode } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher.js';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <div className="fixed right-4 top-3 z-50">
        <LanguageSwitcher />
      </div>
      {children}
    </>
  );
}
