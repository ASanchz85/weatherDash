import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRotation } from './useRotation';

const INTERVAL_MS = 300_000;

describe('useRotation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('avanza de página cada intervalo y vuelve a la primera', () => {
    const { result } = renderHook(() => useRotation(2, INTERVAL_MS));
    expect(result.current).toEqual({ page: 0, tick: 0, isRotating: true });

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS);
    });
    expect(result.current).toEqual({ page: 1, tick: 1, isRotating: true });

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS);
    });
    expect(result.current).toEqual({ page: 0, tick: 2, isRotating: true });
  });

  it('no rota sin intervalo o con intervalo 0', () => {
    for (const intervalMs of [null, 0]) {
      const { result, unmount } = renderHook(() => useRotation(2, intervalMs));

      act(() => {
        vi.advanceTimersByTime(INTERVAL_MS * 3);
      });
      expect(result.current).toEqual({ page: 0, tick: 0, isRotating: false });
      expect(vi.getTimerCount()).toBe(0);
      unmount();
    }
  });

  it('con una sola página mantiene la página 0 pero sigue emitiendo ciclos', () => {
    const { result } = renderHook(() => useRotation(1, INTERVAL_MS));

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS * 2);
    });
    expect(result.current).toEqual({ page: 0, tick: 2, isRotating: true });
  });

  it('muestra la página fijada y no rota', () => {
    const { result } = renderHook(() => useRotation(2, INTERVAL_MS, 1));

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS * 3);
    });
    expect(result.current).toEqual({ page: 1, tick: 0, isRotating: false });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantiene un único temporizador y lo libera al desmontarse', () => {
    const { unmount } = renderHook(() => useRotation(2, INTERVAL_MS));
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
