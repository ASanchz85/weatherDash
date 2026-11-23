import { useEffect, useState } from 'react';

/**
 * Índice de la página activa, que avanza cada intervalMs con un único temporizador.
 * Sin intervalo (null, 0), con una sola página o con una página fijada no rota.
 */
export function useRotation(pageCount: number, intervalMs: number | null, pinnedPage: number | null = null): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (pinnedPage !== null || !intervalMs || intervalMs <= 0 || pageCount <= 1) return;

    const id = window.setInterval(() => setTick((previous) => previous + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, pageCount, pinnedPage]);

  return (pinnedPage ?? tick) % Math.max(pageCount, 1);
}
