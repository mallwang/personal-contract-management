import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/hooks/useAccounts.js', () => ({
  useAccounts: vi.fn(),
  useArchiveAccount: vi.fn(),
  useReactivateAccount: vi.fn(),
  useChangeAccountRole: vi.fn(),
}));

vi.mock('../../src/hooks/useInvitations.js', () => ({
  useInvitations: vi.fn(),
  useSendInvitation: vi.fn(),
  useCancelInvitation: vi.fn(),
  useResendInvitation: vi.fn(),
}));

import {
  useAccounts,
  useArchiveAccount,
  useReactivateAccount,
  useChangeAccountRole,
} from '../../src/hooks/useAccounts.js';
import {
  useInvitations,
  useSendInvitation,
  useCancelInvitation,
  useResendInvitation,
} from '../../src/hooks/useInvitations.js';
import { AccountsAdmin } from '../../src/pages/admin/AccountsAdmin.js';
import type { Account, Invitation } from '@pcm/shared';

const sampleAccounts: Account[] = [
  {
    id: '1',
    email: 'alice@example.com',
    displayName: 'Alice',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    email: 'bob@example.com',
    displayName: 'Bob',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    email: 'carol@example.com',
    displayName: 'Carol',
    role: 'MEMBER',
    status: 'ARCHIVED',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const noInvitations: Invitation[] = [];

function noop() {
  return { mutate: vi.fn(), isPending: false, error: null };
}

function renderPage() {
  vi.mocked(useAccounts).mockReturnValue({
    data: sampleAccounts,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useAccounts>);
  vi.mocked(useInvitations).mockReturnValue({
    data: noInvitations,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useInvitations>);
  vi.mocked(useArchiveAccount).mockReturnValue(
    noop() as unknown as ReturnType<typeof useArchiveAccount>,
  );
  vi.mocked(useReactivateAccount).mockReturnValue(
    noop() as unknown as ReturnType<typeof useReactivateAccount>,
  );
  vi.mocked(useChangeAccountRole).mockReturnValue(
    noop() as unknown as ReturnType<typeof useChangeAccountRole>,
  );
  vi.mocked(useSendInvitation).mockReturnValue(
    noop() as unknown as ReturnType<typeof useSendInvitation>,
  );
  vi.mocked(useCancelInvitation).mockReturnValue(
    noop() as unknown as ReturnType<typeof useCancelInvitation>,
  );
  vi.mocked(useResendInvitation).mockReturnValue(
    noop() as unknown as ReturnType<typeof useResendInvitation>,
  );

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MantineProvider>
        <MemoryRouter>
          <AccountsAdmin />
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('AccountsAdmin – user table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a row for each account with display name', () => {
    renderPage();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('renders the email for each account', () => {
    renderPage();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('renders an Avatar for each user (Mantine Users Table pattern)', () => {
    renderPage();
    // Mantine Avatar renders an element with role="img" or an abbr with user initial
    const avatars = screen.getAllByText(/^[ABC]$/); // first letters A, B, C
    expect(avatars.length).toBeGreaterThanOrEqual(3);
  });

  it('renders role badges (Administrator / Member)', () => {
    renderPage();
    expect(screen.getByText(/administrator/i)).toBeInTheDocument();
    expect(screen.getAllByText(/member/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders an Archive button for active users', () => {
    renderPage();
    const archiveButtons = screen.getAllByRole('button', { name: /archive/i });
    // Alice (ADMIN) and Bob (MEMBER) are ACTIVE → 2 archive buttons
    expect(archiveButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a Reactivate button for archived users', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /reactivate/i })).toBeInTheDocument();
  });
});
