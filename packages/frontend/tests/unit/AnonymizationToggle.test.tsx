import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnonymizationToggle } from '../../src/components/AnonymizationToggle.js';

describe('AnonymizationToggle', () => {
  it('renders a button', () => {
    render(<AnonymizationToggle isActive={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<AnonymizationToggle isActive={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('has aria-pressed=false when isActive=false', () => {
    render(<AnonymizationToggle isActive={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('has aria-pressed=true when isActive=true', () => {
    render(<AnonymizationToggle isActive={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders different label text when active vs inactive', () => {
    const { rerender } = render(<AnonymizationToggle isActive={false} onToggle={vi.fn()} />);
    const inactiveText = screen.getByRole('button').textContent;

    rerender(<AnonymizationToggle isActive={true} onToggle={vi.fn()} />);
    const activeText = screen.getByRole('button').textContent;

    expect(inactiveText).not.toBe(activeText);
  });
});
