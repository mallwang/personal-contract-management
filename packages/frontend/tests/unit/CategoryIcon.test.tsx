import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Zap, Play, Shield, Home, FileText } from 'lucide-react';
import { CategoryIcon, CATEGORY_ICON_MAP } from '../../src/components/CategoryIcon.js';
import type { Category } from '@pcm/shared';

describe('CATEGORY_ICON_MAP', () => {
  it('maps UTILITIES to Zap', () => {
    expect(CATEGORY_ICON_MAP['UTILITIES']).toBe(Zap);
  });

  it('maps SUBSCRIPTIONS to Play', () => {
    expect(CATEGORY_ICON_MAP['SUBSCRIPTIONS']).toBe(Play);
  });

  it('maps INSURANCE to Shield', () => {
    expect(CATEGORY_ICON_MAP['INSURANCE']).toBe(Shield);
  });

  it('maps HOUSING to Home', () => {
    expect(CATEGORY_ICON_MAP['HOUSING']).toBe(Home);
  });

  it('maps OTHER to FileText', () => {
    expect(CATEGORY_ICON_MAP['OTHER']).toBe(FileText);
  });

  it('maps DEFAULT to FileText', () => {
    expect(CATEGORY_ICON_MAP['DEFAULT']).toBe(FileText);
  });
});

describe('CategoryIcon component', () => {
  it('renders an SVG for UTILITIES', () => {
    const { container } = render(<CategoryIcon category="UTILITIES" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders an SVG for SUBSCRIPTIONS', () => {
    const { container } = render(<CategoryIcon category="SUBSCRIPTIONS" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders an SVG for INSURANCE', () => {
    const { container } = render(<CategoryIcon category="INSURANCE" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders an SVG for HOUSING', () => {
    const { container } = render(<CategoryIcon category="HOUSING" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders an SVG for OTHER', () => {
    const { container } = render(<CategoryIcon category="OTHER" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders a fallback SVG for an unknown category value', () => {
    const { container } = render(<CategoryIcon category={'UNKNOWN' as Category} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies the provided className to the rendered icon', () => {
    const { container } = render(
      <CategoryIcon category="UTILITIES" className="h-4 w-4 text-red-500" />,
    );
    const svg = container.querySelector('svg');
    const cls = svg?.getAttribute('class') ?? '';
    expect(cls).toContain('h-4');
    expect(cls).toContain('w-4');
  });

  it('renders the Zap icon for UTILITIES (lucide class)', () => {
    const { container } = render(<CategoryIcon category="UTILITIES" />);
    expect(container.querySelector('.lucide-zap')).not.toBeNull();
  });

  it('renders the Play icon for SUBSCRIPTIONS (lucide class)', () => {
    const { container } = render(<CategoryIcon category="SUBSCRIPTIONS" />);
    expect(container.querySelector('.lucide-play')).not.toBeNull();
  });

  it('renders the Shield icon for INSURANCE (lucide class)', () => {
    const { container } = render(<CategoryIcon category="INSURANCE" />);
    expect(container.querySelector('.lucide-shield')).not.toBeNull();
  });

  it('renders the Home/House icon for HOUSING (lucide class)', () => {
    const { container } = render(<CategoryIcon category="HOUSING" />);
    // In Lucide React v1.x, Home is aliased to House → CSS class is lucide-house
    const svg = container.querySelector('svg');
    const cls = svg?.getAttribute('class') ?? '';
    expect(cls.includes('lucide-home') || cls.includes('lucide-house')).toBe(true);
  });

  it('renders the FileText icon for OTHER (lucide class)', () => {
    const { container } = render(<CategoryIcon category="OTHER" />);
    expect(container.querySelector('.lucide-file-text')).not.toBeNull();
  });

  it('renders the FileText fallback for an unknown category (lucide class)', () => {
    const { container } = render(<CategoryIcon category={'UNKNOWN' as Category} />);
    expect(container.querySelector('.lucide-file-text')).not.toBeNull();
  });
});
