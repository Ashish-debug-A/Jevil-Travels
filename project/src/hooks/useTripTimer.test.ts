import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTripTimer } from './useTripTimer';

describe('useTripTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zero elapsed and "00:00" display when startTime is null', () => {
    const { result } = renderHook(() => useTripTimer(null));
    expect(result.current.elapsed).toBe(0);
    expect(result.current.display).toBe('00:00');
  });

  it('computes elapsed seconds from startTime', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const startTime = new Date(now - 65_000).toISOString(); // 65 seconds ago
    const { result } = renderHook(() => useTripTimer(startTime));

    // Trigger the requestAnimationFrame tick
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.elapsed).toBe(65);
    expect(result.current.display).toBe('01:05');
  });

  it('formats hours when elapsed >= 3600', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const startTime = new Date(now - 3_661_000).toISOString(); // 1h 1m 1s ago
    const { result } = renderHook(() => useTripTimer(startTime));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.elapsed).toBe(3661);
    expect(result.current.display).toBe('1:01:01');
  });

  it('resets to zero when startTime changes to null', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const startTime = new Date(now - 30_000).toISOString();
    const { result, rerender } = renderHook(
      ({ st }) => useTripTimer(st),
      { initialProps: { st: startTime as string | null } }
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.elapsed).toBeGreaterThan(0);

    rerender({ st: null });

    expect(result.current.elapsed).toBe(0);
    expect(result.current.display).toBe('00:00');
  });

  it('pads minutes and seconds with leading zeros', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const startTime = new Date(now - 5_000).toISOString(); // 5 seconds ago
    const { result } = renderHook(() => useTripTimer(startTime));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.display).toBe('00:05');
  });
});
