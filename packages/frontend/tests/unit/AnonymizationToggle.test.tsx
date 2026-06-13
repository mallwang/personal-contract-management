import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { AnonymizationToggle } from '../../src/components/AnonymizationToggle.js';

function renderToggle(isActive: boolean, onToggle = vi.fn()) {
  return render(
    <MantineProvider>
      <AnonymizationToggle isActive={isActive} onToggle={onToggle} />
    </MantineProvider>,
  );
}

describe('AnonymizationToggle', () => {
  it('renders a switch', () => {
    renderToggle(false);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderToggle(false, onToggle);
    await user.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('is unchecked when isActive=false', () => {
    renderToggle(false);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('is checked when isActive=true', () => {
    renderToggle(true);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('has an accessible label', () => {
    renderToggle(false);
    // Mantine Switch can carry a label via aria-label or visible label text
    const sw = screen.getByRole('switch');
    const label = sw.getAttribute('aria-label') ?? sw.getAttribute('aria-labelledby');
    expect(label).toBeTruthy();
  });
});
