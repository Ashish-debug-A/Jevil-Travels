import { useState, useEffect, useRef } from 'react';

export function useTripTimer(startTime: string | null) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const start = new Date(startTime).getTime();

    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const display = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { elapsed, display };
}
