import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OwnerDashboard from './OwnerDashboard';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children?: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ flyTo: vi.fn() }),
}));

vi.mock('leaflet', () => {
  class MockIcon {}
  return {
    default: { Icon: MockIcon },
    Icon: MockIcon,
  };
});

const mockDrivers = [
  { id: 'd1', name: 'Ravi Kumar', students: ['Alice', 'Bob'], status: 'on_trip', last_seen: new Date().toISOString() },
  { id: 'd2', name: 'Priya Sharma', students: ['Charlie'], status: 'idle', last_seen: null },
];

const mockLocations = [
  { driver_id: 'd1', lat: 28.6139, lng: 77.209, timestamp: new Date().toISOString(), status: 'on_trip' },
];

const mockTrips = [
  {
    id: 't1',
    driver_id: 'd1',
    driver_name: 'Ravi Kumar',
    students: ['Alice', 'Bob'],
    start_time: '2025-01-15T10:00:00Z',
    end_time: '2025-01-15T11:30:00Z',
    duration_seconds: 5400,
    distance_meters: 12500,
    gps_path: [{ lat: 28.6, lng: 77.2, timestamp: '2025-01-15T10:00:00Z' }, { lat: 28.7, lng: 77.3, timestamp: '2025-01-15T11:30:00Z' }],
    status: 'completed',
  },
];

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'drivers') {
        return {
          select: () => ({
            order: () => Promise.resolve({ data: mockDrivers, error: null }),
          }),
        };
      }
      if (table === 'driver_current_location') {
        return {
          select: () => Promise.resolve({ data: mockLocations, error: null }),
        };
      }
      if (table === 'trips') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: mockTrips, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => Promise.resolve({ data: [], error: null }),
      };
    },
    channel: () => mockChannel,
    removeChannel: vi.fn(),
  },
}));

describe('OwnerDashboard', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header with "Owner Dashboard" subtitle', async () => {
    render(<OwnerDashboard onBack={onBack} />);
    expect(screen.getByText('Owner Dashboard')).toBeInTheDocument();
  });

  it('shows active driver count in the header', async () => {
    render(<OwnerDashboard onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('1 Active')).toBeInTheDocument();
    });
  });

  it('renders the map tab by default', () => {
    render(<OwnerDashboard onBack={onBack} />);
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('renders bottom navigation with three tabs', () => {
    render(<OwnerDashboard onBack={onBack} />);
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Drivers')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('switches to drivers tab and lists all drivers', async () => {
    const user = userEvent.setup();
    render(<OwnerDashboard onBack={onBack} />);

    await user.click(screen.getByText('Drivers'));

    await waitFor(() => {
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });
  });

  it('shows driver count in drivers tab heading', async () => {
    const user = userEvent.setup();
    render(<OwnerDashboard onBack={onBack} />);

    await user.click(screen.getByText('Drivers'));

    await waitFor(() => {
      expect(screen.getByText('All Drivers (2)')).toBeInTheDocument();
    });
  });

  it('shows student count for each driver in the drivers tab', async () => {
    const user = userEvent.setup();
    render(<OwnerDashboard onBack={onBack} />);

    await user.click(screen.getByText('Drivers'));

    await waitFor(() => {
      expect(screen.getByText('2 students')).toBeInTheDocument();
      expect(screen.getByText('1 students')).toBeInTheDocument();
    });
  });

  it('switches to history tab and shows trip history heading', async () => {
    const user = userEvent.setup();
    render(<OwnerDashboard onBack={onBack} />);

    await user.click(screen.getByText('History'));

    await waitFor(() => {
      expect(screen.getByText('Trip History')).toBeInTheDocument();
    });
  });

  it('loads and displays completed trips in history tab', async () => {
    const user = userEvent.setup();
    render(<OwnerDashboard onBack={onBack} />);

    await user.click(screen.getByText('History'));

    await waitFor(() => {
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
      expect(screen.getByText('12.5km')).toBeInTheDocument();
    });
  });

  it('shows "Live" indicator for drivers with active location', async () => {
    const user = userEvent.setup();
    render(<OwnerDashboard onBack={onBack} />);

    await user.click(screen.getByText('Drivers'));

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('subscribes to realtime channels on mount', () => {
    render(<OwnerDashboard onBack={onBack} />);
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });
});
