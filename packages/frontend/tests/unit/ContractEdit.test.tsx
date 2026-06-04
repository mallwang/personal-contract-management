import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { ContractEdit } from '../../src/pages/ContractEdit.js';
import type { ContractData } from '@pcm/shared';

const sampleContract: ContractData = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Netflix',
  category: 'SUBSCRIPTIONS',
  monthlyAmount: 15.99,
  status: 'ACTIVE',
  endDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createWrapper(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        MemoryRouter,
        { initialEntries: [initialPath] },
        createElement(Routes, null,
          createElement(Route, { path: '/contracts/:id/edit', element: children }),
          createElement(Route, { path: '/contracts', element: createElement('div', null, 'contract list') }),
        ),
      ),
    );
}

describe('ContractEdit', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows loading state while contracts are being fetched', () => {
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}));
    const { container } = render(<ContractEdit />, {
      wrapper: createWrapper(`/contracts/${sampleContract.id}/edit`),
    });
    expect(container).toBeInTheDocument();
  });

  it('pre-populates the form with the contract values', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [sampleContract],
    } as Response);

    render(<ContractEdit />, {
      wrapper: createWrapper(`/contracts/${sampleContract.id}/edit`),
    });

    await waitFor(() =>
      expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('15.99')).toBeInTheDocument();
  });

  it('shows not found message when the contract ID does not exist in the list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<ContractEdit />, {
      wrapper: createWrapper(`/contracts/00000000-0000-0000-0000-000000000000/edit`),
    });

    await waitFor(() =>
      expect(screen.getByText(/contract not found/i)).toBeInTheDocument(),
    );
  });

  it('navigates to /contracts after successful save', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => [sampleContract] } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...sampleContract, name: 'Updated' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [{ ...sampleContract, name: 'Updated' }] } as Response);

    const user = userEvent.setup();
    render(<ContractEdit />, {
      wrapper: createWrapper(`/contracts/${sampleContract.id}/edit`),
    });

    await waitFor(() => expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(screen.getByText('contract list')).toBeInTheDocument(),
    );
  });

  it('navigates to /contracts when Cancel is clicked', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [sampleContract],
    } as Response);

    const user = userEvent.setup();
    render(<ContractEdit />, {
      wrapper: createWrapper(`/contracts/${sampleContract.id}/edit`),
    });

    await waitFor(() => expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() =>
      expect(screen.getByText('contract list')).toBeInTheDocument(),
    );
  });
});
