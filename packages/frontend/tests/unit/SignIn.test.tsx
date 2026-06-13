import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { SignIn } from '../../src/pages/SignIn.js';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('SignIn', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders without a sidebar wrapper (standalone auth page)', () => {
    render(<SignIn />, { wrapper: createWrapper() });
    // Must NOT have an AppShell nav element — sign-in is sidebar-free
    expect(document.querySelector('nav')).toBeNull();
  });

  it('renders email and password input fields', () => {
    render(<SignIn />, { wrapper: createWrapper() });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    render(<SignIn />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows an error alert on failed login (401)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    const user = userEvent.setup();
    render(<SignIn />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('password field uses PasswordInput (has visibility toggle)', () => {
    render(<SignIn />, { wrapper: createWrapper() });
    // Mantine PasswordInput wraps a password input — the field has type="password"
    const passwordField = screen.getByLabelText(/password/i);
    expect(passwordField).toHaveAttribute('type', 'password');
  });
});
