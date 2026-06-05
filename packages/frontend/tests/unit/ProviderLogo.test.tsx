import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderLogo, logoUrl } from '../../src/components/ProviderLogo.js';

const TOKEN = 'pk_dTJBcEKxQgCQUZhio2o9Vw';

beforeEach(() => {
  vi.stubEnv('VITE_LOGO_DEV_TOKEN', TOKEN);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('logoUrl()', () => {
  it('returns a logo.dev URL for a non-empty name when not anonymized', () => {
    const url = logoUrl('Netflix', false);
    expect(url).toBe(`https://img.logo.dev/name/Netflix?token=${TOKEN}`);
  });

  it('URL-encodes names with spaces', () => {
    const url = logoUrl('Amazon Prime', false);
    expect(url).toBe(`https://img.logo.dev/name/Amazon%20Prime?token=${TOKEN}`);
  });

  it('returns null when name is empty string', () => {
    expect(logoUrl('', false)).toBeNull();
  });

  it('returns null when name is whitespace only', () => {
    expect(logoUrl('   ', false)).toBeNull();
  });

  it('returns null when isAnonymized is true regardless of name', () => {
    expect(logoUrl('Netflix', true)).toBeNull();
  });
});

describe('ProviderLogo component', () => {
  it('renders an <img> with correct src when name is non-empty and not anonymized', () => {
    render(<ProviderLogo name="Netflix" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', `https://img.logo.dev/name/Netflix?token=${TOKEN}`);
  });

  it('renders a fallback Building2 SVG when name is empty', () => {
    const { container } = render(<ProviderLogo name="" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders a fallback Building2 SVG when isAnonymized is true', () => {
    const { container } = render(<ProviderLogo name="Netflix" isAnonymized={true} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders a fallback SVG after the img onError fires', () => {
    const { container } = render(<ProviderLogo name="Netflix" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('switches to fallback SVG when isAnonymized flips to true', () => {
    const { container, rerender } = render(<ProviderLogo name="Netflix" isAnonymized={false} />);
    expect(container.querySelector('img')).not.toBeNull();
    rerender(<ProviderLogo name="Netflix" isAnonymized={true} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies the size prop as width and height on the container', () => {
    const { container } = render(<ProviderLogo name="Netflix" size={32} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('32px');
    expect(wrapper.style.height).toBe('32px');
  });

  it('renders the Building2 lucide icon as fallback (lucide class)', () => {
    const { container } = render(<ProviderLogo name="" />);
    const svg = container.querySelector('svg');
    const cls = svg?.getAttribute('class') ?? '';
    expect(cls.includes('lucide-building-2') || cls.includes('lucide-building2')).toBe(true);
  });
});
