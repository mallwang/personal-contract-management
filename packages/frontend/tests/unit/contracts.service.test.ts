import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import {
  useContracts,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
} from '../../src/services/contracts.js';
import type { ContractData } from '@pcm/shared';

const sampleContract: ContractData = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Netflix',
  category: 'SUBSCRIPTIONS',
  amount: 15.99,
  billingInterval: 'MONTHLY',
  status: 'ACTIVE',
  endDate: null,
  startDate: null,
  details: null,
  serviceUrl: null,
  cancellationPeriod: null,
  anonymize: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useContracts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns contract data on successful fetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [sampleContract],
    } as Response);

    const { result } = renderHook(() => useContracts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.name).toBe('Netflix');
  });

  it('returns error state when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useContracts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateContract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to /api/contracts and returns the created contract', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleContract,
    } as Response);

    const { result } = renderHook(() => useCreateContract(), { wrapper: createWrapper() });
    result.current.mutate({
      name: 'Netflix',
      category: 'SUBSCRIPTIONS',
      amount: 15.99,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith(
      '/api/contracts',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('useUpdateContract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls PUT /api/contracts/:id with the patch body', async () => {
    const updated = { ...sampleContract, name: 'Updated' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => updated,
    } as Response);

    const { result } = renderHook(() => useUpdateContract(), { wrapper: createWrapper() });
    result.current.mutate({ id: sampleContract.id, body: { name: 'Updated' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith(
      `/api/contracts/${sampleContract.id}`,
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

describe('useDeleteContract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls DELETE /api/contracts/:id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
    } as Response);

    const { result } = renderHook(() => useDeleteContract(), { wrapper: createWrapper() });
    result.current.mutate(sampleContract.id);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith(
      `/api/contracts/${sampleContract.id}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
