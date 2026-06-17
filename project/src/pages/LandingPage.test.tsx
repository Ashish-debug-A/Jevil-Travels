import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from './LandingPage';

const mockDrivers = [
  { id: 'd1', name: 'Ravi Kumar', students: ['Alice', 'Bob'], status: 'idle', last_seen: null },
  { id: 'd2', name: 'Priya Sharma', students: ['Charlie'], status: 'on_trip', last_seen: null },
];

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe('LandingPage', () => {
  const onSelectDriver = vi.fn();
  const onOpenOwner = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFrom.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: mockDrivers, error: null }),
      }),
    });
  });

  it('renders the app title and tagline', async () => {
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);
    expect(screen.getByText('Jevil Travels')).toBeInTheDocument();
    expect(screen.getByText('Your Journey is Our Priority.')).toBeInTheDocument();
  });

  it('renders the owner dashboard button', () => {
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);
    expect(screen.getByText('Owner Dashboard')).toBeInTheDocument();
  });

  it('calls onOpenOwner when owner button is clicked', async () => {
    const user = userEvent.setup();
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);
    await user.click(screen.getByText('Owner Dashboard'));
    expect(onOpenOwner).toHaveBeenCalledOnce();
  });

  it('loads and renders drivers from supabase', async () => {
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);

    await waitFor(() => {
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });
  });

  it('shows student count per driver', async () => {
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);

    await waitFor(() => {
      expect(screen.getByText('2 students assigned')).toBeInTheDocument();
      expect(screen.getByText('1 students assigned')).toBeInTheDocument();
    });
  });

  it('calls onSelectDriver with correct id when driver is clicked', async () => {
    const user = userEvent.setup();
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);

    await waitFor(() => {
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Ravi Kumar'));
    expect(onSelectDriver).toHaveBeenCalledWith('d1');
  });

  it('filters drivers by search query', async () => {
    const user = userEvent.setup();
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);

    await waitFor(() => {
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search drivers...'), 'priya');

    expect(screen.queryByText('Ravi Kumar')).not.toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
  });

  it('shows "No drivers found" for non-matching search', async () => {
    const user = userEvent.setup();
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);

    await waitFor(() => {
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search drivers...'), 'zzzzzz');

    expect(screen.getByText('No drivers found')).toBeInTheDocument();
  });

  it('renders cached drivers from localStorage immediately', async () => {
    localStorage.setItem('jevil_drivers', JSON.stringify(mockDrivers));

    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);

    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
  });

  it('renders the footer text', async () => {
    render(<LandingPage onSelectDriver={onSelectDriver} onOpenOwner={onOpenOwner} />);
    expect(screen.getByText(/Eco-Friendly College Transport/)).toBeInTheDocument();
  });
});
