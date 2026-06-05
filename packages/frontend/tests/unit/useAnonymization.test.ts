import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnonymization } from '../../src/hooks/useAnonymization.js';
import type { ContractData } from '@pcm/shared';

const makeContract = (overrides: Partial<ContractData> = {}): ContractData => ({
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
  ...overrides,
});

describe('useAnonymization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with isAnonymized=false when localStorage is empty', () => {
    const { result } = renderHook(() => useAnonymization());
    expect(result.current.isAnonymized).toBe(false);
  });

  it('starts with isAnonymized=true when localStorage has pcm-anonymize=1', () => {
    localStorage.setItem('pcm-anonymize', '1');
    const { result } = renderHook(() => useAnonymization());
    expect(result.current.isAnonymized).toBe(true);
  });

  it('toggleAnonymization flips isAnonymized from false to true', () => {
    const { result } = renderHook(() => useAnonymization());
    act(() => {
      result.current.toggleAnonymization();
    });
    expect(result.current.isAnonymized).toBe(true);
  });

  it('toggleAnonymization persists state to localStorage', () => {
    const { result } = renderHook(() => useAnonymization());
    act(() => {
      result.current.toggleAnonymization();
    });
    expect(localStorage.getItem('pcm-anonymize')).toBe('1');
  });

  it('toggleAnonymization removes key from localStorage when toggled off', () => {
    localStorage.setItem('pcm-anonymize', '1');
    const { result } = renderHook(() => useAnonymization());
    act(() => {
      result.current.toggleAnonymization();
    });
    expect(localStorage.getItem('pcm-anonymize')).toBeNull();
    expect(result.current.isAnonymized).toBe(false);
  });

  it('getDisplayName returns real name when not anonymized and contract.anonymize=false', () => {
    const { result } = renderHook(() => useAnonymization());
    const contract = makeContract({ name: 'Netflix', anonymize: false });
    expect(result.current.getDisplayName(contract)).toBe('Netflix');
  });

  it('getDisplayName returns fantasy name when global toggle is active', () => {
    const { result } = renderHook(() => useAnonymization());
    act(() => {
      result.current.toggleAnonymization();
    });
    const contract = makeContract({ name: 'Netflix', anonymize: false });
    const displayed = result.current.getDisplayName(contract);
    expect(displayed).not.toBe('Netflix');
    expect(displayed.length).toBeGreaterThan(0);
  });

  it('getDisplayName returns fantasy name when contract.anonymize=true even if global toggle is off', () => {
    const { result } = renderHook(() => useAnonymization());
    expect(result.current.isAnonymized).toBe(false);
    const contract = makeContract({ name: 'Netflix', anonymize: true });
    const displayed = result.current.getDisplayName(contract);
    expect(displayed).not.toBe('Netflix');
    expect(displayed.length).toBeGreaterThan(0);
  });

  it('getDisplayName is stable: same contract always gets same fantasy name', () => {
    const { result } = renderHook(() => useAnonymization());
    act(() => {
      result.current.toggleAnonymization();
    });
    const contract = makeContract();
    const first = result.current.getDisplayName(contract);
    const second = result.current.getDisplayName(contract);
    expect(first).toBe(second);
  });
});
