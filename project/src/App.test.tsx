import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

vi.mock('./lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          data: [],
          error: null,
        }),
      }),
    }),
  },
}));

vi.mock('./pages/LandingPage', () => ({
  default: ({ onSelectDriver, onOpenOwner }: { onSelectDriver: (id: string) => void; onOpenOwner: () => void }) => (
    <div>
      <span>Landing Page</span>
      <button onClick={() => onSelectDriver('driver-1')}>Select Driver</button>
      <button onClick={onOpenOwner}>Open Owner</button>
    </div>
  ),
}));

vi.mock('./pages/DriverPage', () => ({
  default: ({ driverId, onBack }: { driverId: string; onBack: () => void }) => (
    <div>
      <span>Driver Page {driverId}</span>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('./pages/OwnerDashboard', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div>
      <span>Owner Dashboard</span>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the landing page initially', () => {
    render(<App />);
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
  });

  it('navigates to driver page when a driver is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Select Driver'));

    expect(screen.getByText('Driver Page driver-1')).toBeInTheDocument();
    expect(screen.queryByText('Landing Page')).not.toBeInTheDocument();
  });

  it('navigates to owner dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Open Owner'));

    expect(screen.getByText('Owner Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Landing Page')).not.toBeInTheDocument();
  });

  it('navigates back from driver page to landing', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Select Driver'));
    expect(screen.getByText('Driver Page driver-1')).toBeInTheDocument();

    await user.click(screen.getByText('Back'));
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
  });

  it('navigates back from owner dashboard to landing', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Open Owner'));
    expect(screen.getByText('Owner Dashboard')).toBeInTheDocument();

    await user.click(screen.getByText('Back'));
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
  });
});
