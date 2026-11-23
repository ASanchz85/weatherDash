import { useEffect, useState } from 'react';

export interface RotationState {
  /** Índice de la página activa. */
  page: number;
  /** Ciclos completados; permite sincronizar otros cambios con la rotación. */
  tick: number;
  isRotating: boolean;
}

/**
 * Página activa y ciclos, que avanzan cada intervalMs con un único temporizador.
 * Sin intervalo (null, 0) o con una página fijada no rota. El temporizador sigue activo con una sola página
 * porque el tick también sincroniza el cambio de tema.
 */
export function useRotation(
  pageCount: number,
  intervalMs: number | null,
  pinnedPage: number | null = null,
): RotationState {
  const [tick, setTick] = useState(0);
  const isRotating = pinnedPage === null && intervalMs !== null && intervalMs > 0;

  useEffect(() => {
    if (!isRotating) return;

    const id = window.setInterval(() => setTick((previous) => previous + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [isRotating, intervalMs]);

  return { page: (pinnedPage ?? tick) % Math.max(pageCount, 1), tick, isRotating };
}
