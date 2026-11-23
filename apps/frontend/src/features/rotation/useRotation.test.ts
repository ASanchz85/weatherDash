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
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS);
    });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS);
    });
    expect(result.current).toBe(0);
  });

  it('no rota sin intervalo, con intervalo 0 o con una sola página', () => {
    for (const [pageCount, intervalMs] of [
      [2, null],
      [2, 0],
      [1, INTERVAL_MS],
    ] as const) {
      const { result, unmount } = renderHook(() => useRotation(pageCount, intervalMs));

      act(() => {
        vi.advanceTimersByTime(INTERVAL_MS * 3);
      });
      expect(result.current).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      unmount();
    }
  });

  it('muestra la página fijada y no rota', () => {
    const { result } = renderHook(() => useRotation(2, INTERVAL_MS, 1));

    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS * 3);
    });
    expect(result.current).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantiene un único temporizador y lo libera al desmontarse', () => {
    const { unmount } = renderHook(() => useRotation(2, INTERVAL_MS));
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
