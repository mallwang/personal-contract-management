import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SessionUser } from '@pcm/shared';

vi.mock('../../src/hooks/useAuth.js', () => ({
  useCurrentUser: vi.fn(),
  useSignOut: vi.fn(),
}));

import { useCurrentUser, useSignOut } from '../../src/hooks/useAuth.js';
import { AppShell } from '../../src/components/AppShell/AppShell.js';

const regularUser: SessionUser = {
  id: '1',
  displayName: 'Test User',
  email: 'test@example.com',
  role: 'MEMBER',
};

const adminUser: SessionUser = {
  id: '2',
  displayName: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
};

function renderAppShell(
  user: SessionUser | null = regularUser,
  signOutMutateMock?: ReturnType<typeof vi.fn>,
) {
  vi.mocked(useCurrentUser).mockReturnValue({ data: user } as ReturnType<typeof useCurrentUser>);
  vi.mocked(useSignOut).mockReturnValue({
    mutate: signOutMutateMock ?? vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useSignOut>);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MemoryRouter>
          <AppShell>
            <div data-testid="content">page content</div>
          </AppShell>
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Phase 2: Foundational — sidebar and children render
  it('renders children in main area', () => {
    renderAppShell();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  // US1: Sidebar navigation links
  it('renders Dashboard nav link', () => {
    renderAppShell();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders Contracts nav link', () => {
    renderAppShell();
    expect(screen.getByRole('link', { name: /contracts/i })).toBeInTheDocument();
  });

  it('renders Account Settings nav link', () => {
    renderAppShell();
    expect(screen.getByRole('link', { name: /account settings/i })).toBeInTheDocument();
  });

  // US2: Admin segment
  it('does not show Admin segment control for regular users', () => {
    renderAppShell(regularUser);
    // SegmentedControl with Admin label should not be present for regular users
    expect(screen.queryByRole('radio', { name: /admin/i })).not.toBeInTheDocument();
  });

  it('shows Admin segment control for admin users', () => {
    renderAppShell(adminUser);
    expect(screen.getByRole('radio', { name: /admin/i })).toBeInTheDocument();
  });

  it('renders Accounts link for admin users after switching to admin segment', async () => {
    const user = userEvent.setup();
    renderAppShell(adminUser);
    await user.click(screen.getByRole('radio', { name: /admin/i }));
    expect(screen.getByRole('link', { name: /accounts/i })).toBeInTheDocument();
  });

  // US4: User display name and sign out
  it('displays the signed-in user display name', () => {
    renderAppShell(regularUser);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('calls signOut when Sign Out button clicked', async () => {
    const signOutMock = vi.fn();
    const user = userEvent.setup();
    renderAppShell(regularUser, signOutMock);
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  // US11: Footer
  it('renders a footer', () => {
    renderAppShell();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
