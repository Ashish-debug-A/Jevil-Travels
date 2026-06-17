import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DriverPage from './DriverPage';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => ({ flyTo: vi.fn() }),
}));

vi.mock('leaflet', () => {
  class MockIcon {}
  return {
    default: { Icon: MockIcon },
    Icon: MockIcon,
  };
});

const mockDriver = {
  id: 'drv-1',
  name: 'Ravi Kumar',
  students: ['Alice', 'Bob'],
  status: 'idle' as const,
  last_seen: null,
};

const mockInsertFn = vi.fn();
const mockUpdateFn = vi.fn();
const mockUpsertFn = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'drivers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockDriver, error: null }),
            }),
            order: () => Promise.resolve({ data: [mockDriver], error: null }),
          }),
          update: () => {
            mockUpdateFn();
            return { eq: () => Promise.resolve({ data: null, error: null }) };
          },
        };
      }
      if (table === 'trips') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
          insert: () => {
            mockInsertFn();
            return {
              select: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { id: 'trip-1', start_time: new Date().toISOString(), gps_path: [] },
                  error: null,
                }),
              }),
            };
          },
          update: () => {
            mockUpdateFn();
            return { eq: () => Promise.resolve({ data: null, error: null }) };
          },
        };
      }
      if (table === 'driver_current_location') {
        return {
          upsert: () => {
            mockUpsertFn();
            return Promise.resolve({ data: null, error: null });
          },
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
          }),
        };
      }
      if (table === 'driver_locations') {
        return {
          insert: () => {
            mockInsertFn();
            return Promise.resolve({ data: null, error: null });
          },
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    },
  },
}));

vi.mock('../hooks/useGps', () => ({
  useGps: () => ({
    position: null,
    isTracking: false,
    error: null,
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
  }),
}));

describe('DriverPage', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<DriverPage driverId="drv-1" onBack={onBack} />);
    expect(screen.getByText('Driver App')).toBeInTheDocument();
  });

  it('renders driver name after loading', async () => {
    render(<DriverPage driverId="drv-1" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    });
  });

  it('renders students list', async () => {
    render(<DriverPage driverId="drv-1" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('renders the map container', async () => {
    render(<DriverPage driverId="drv-1" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeInTheDocument();
    });
  });

  it('renders START TRIP button for idle driver', async () => {
    render(<DriverPage driverId="drv-1" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('START TRIP')).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<DriverPage driverId="drv-1" onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('All Drivers')).toBeInTheDocument();
    });

    await user.click(screen.getByText('All Drivers'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders StatusBadge for the driver', async () => {
    render(<DriverPage driverId="drv-1" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('Idle')).toBeInTheDocument();
    });
  });

  it('renders header with driver subtitle', async () => {
    render(<DriverPage driverId="drv-1" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('Driver: Ravi Kumar')).toBeInTheDocument();
    });
  });
});
