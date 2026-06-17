import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomNav from './BottomNav';

describe('BottomNav', () => {
  it('renders all three tabs', () => {
    render(<BottomNav active="map" onChange={() => {}} />);
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Drivers')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('highlights the active tab with brand color', () => {
    render(<BottomNav active="drivers" onChange={() => {}} />);
    const driversBtn = screen.getByText('Drivers').closest('button');
    expect(driversBtn?.className).toContain('text-brand-500');
  });

  it('does not highlight inactive tabs with brand color', () => {
    render(<BottomNav active="drivers" onChange={() => {}} />);
    const mapBtn = screen.getByText('Map').closest('button');
    expect(mapBtn?.className).not.toContain('text-brand-500');
  });

  it('calls onChange with the correct tab when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BottomNav active="map" onChange={onChange} />);

    await user.click(screen.getByText('History'));
    expect(onChange).toHaveBeenCalledWith('history');

    await user.click(screen.getByText('Drivers'));
    expect(onChange).toHaveBeenCalledWith('drivers');
  });
});
