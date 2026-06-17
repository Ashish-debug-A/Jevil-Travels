import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGps } from './useGps';

describe('useGps', () => {
  let watchPositionMock: ReturnType<typeof vi.fn>;
  let clearWatchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    watchPositionMock = vi.fn().mockReturnValue(42);
    clearWatchMock = vi.fn();

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        watchPosition: watchPositionMock,
        clearWatch: clearWatchMock,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with null position, not tracking, and no error', () => {
    const { result } = renderHook(() => useGps());
    expect(result.current.position).toBeNull();
    expect(result.current.isTracking).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error when geolocation is not supported', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useGps());

    act(() => {
      result.current.startTracking();
    });

    expect(result.current.error).toBe('Geolocation not supported');
    expect(result.current.isTracking).toBe(false);
  });

  it('starts tracking and calls watchPosition', () => {
    const { result } = renderHook(() => useGps(8000));

    act(() => {
      result.current.startTracking();
    });

    expect(result.current.isTracking).toBe(true);
    expect(watchPositionMock).toHaveBeenCalledTimes(1);
  });

  it('sets position when watchPosition success callback fires', () => {
    const { result } = renderHook(() => useGps(0));

    act(() => {
      result.current.startTracking();
    });

    const successCallback = watchPositionMock.mock.calls[0][0];

    act(() => {
      successCallback({
        coords: { latitude: 28.6139, longitude: 77.209, accuracy: 10 },
      });
    });

    expect(result.current.position).toEqual(
      expect.objectContaining({
        lat: 28.6139,
        lng: 77.209,
        accuracy: 10,
      })
    );
  });

  it('throttles position updates by intervalMs', () => {
    const now = 1000000;
    vi.setSystemTime(now);

    const { result } = renderHook(() => useGps(8000));

    act(() => {
      result.current.startTracking();
    });

    const successCallback = watchPositionMock.mock.calls[0][0];

    // First call — should update (lastSendRef starts at 0)
    act(() => {
      successCallback({
        coords: { latitude: 10, longitude: 20, accuracy: 5 },
      });
    });
    expect(result.current.position).not.toBeNull();

    // Second call right away — should be throttled
    const firstPosition = result.current.position;
    act(() => {
      successCallback({
        coords: { latitude: 30, longitude: 40, accuracy: 5 },
      });
    });
    expect(result.current.position).toBe(firstPosition);

    // Advance past interval
    vi.setSystemTime(now + 9000);
    act(() => {
      successCallback({
        coords: { latitude: 30, longitude: 40, accuracy: 5 },
      });
    });
    expect(result.current.position?.lat).toBe(30);
  });

  it('sets error and stops tracking on watchPosition error', () => {
    const { result } = renderHook(() => useGps());

    act(() => {
      result.current.startTracking();
    });

    const errorCallback = watchPositionMock.mock.calls[0][1];

    act(() => {
      errorCallback({ message: 'User denied Geolocation' });
    });

    expect(result.current.error).toBe('User denied Geolocation');
    expect(result.current.isTracking).toBe(false);
  });

  it('stops tracking and clears the watch', () => {
    const { result } = renderHook(() => useGps());

    act(() => {
      result.current.startTracking();
    });

    expect(result.current.isTracking).toBe(true);

    act(() => {
      result.current.stopTracking();
    });

    expect(result.current.isTracking).toBe(false);
    expect(clearWatchMock).toHaveBeenCalledWith(42);
  });

  it('cleans up watchPosition on unmount', () => {
    const { result, unmount } = renderHook(() => useGps());

    act(() => {
      result.current.startTracking();
    });

    unmount();

    expect(clearWatchMock).toHaveBeenCalledWith(42);
  });
});
