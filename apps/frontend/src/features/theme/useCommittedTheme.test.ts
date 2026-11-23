import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Theme } from '../../types/theme';
import { useCommittedTheme } from './useCommittedTheme';

interface Props {
  desired: Theme | null;
  tick: number;
  isRotating: boolean;
}

function renderTheme(initial: Props) {
  return renderHook(({ desired, tick, isRotating }: Props) => useCommittedTheme(desired, tick, isRotating), {
    initialProps: initial,
  });
}

describe('useCommittedTheme', () => {
  it('muestra el tema de día mientras no hay datos', () => {
    const { result } = renderTheme({ desired: null, tick: 0, isRotating: true });

    expect(result.current).toBe('day');
  });

  it('aplica al instante el primer dato válido', () => {
    const { result, rerender } = renderTheme({ desired: null, tick: 0, isRotating: true });

    rerender({ desired: 'night', tick: 0, isRotating: true });

    expect(result.current).toBe('night');
  });

  it('espera al siguiente ciclo para aplicar un cambio posterior', () => {
    const { result, rerender } = renderTheme({ desired: 'day', tick: 0, isRotating: true });

    rerender({ desired: 'night', tick: 0, isRotating: true });
    expect(result.current).toBe('day');

    rerender({ desired: 'night', tick: 1, isRotating: true });
    expect(result.current).toBe('night');
  });

  it('aplica los cambios al instante si la rotación está desactivada', () => {
    const { result, rerender } = renderTheme({ desired: 'day', tick: 0, isRotating: false });

    rerender({ desired: 'night', tick: 0, isRotating: false });

    expect(result.current).toBe('night');
  });

  it('conserva el último tema si los datos dejan de estar disponibles', () => {
    const { result, rerender } = renderTheme({ desired: 'night', tick: 0, isRotating: true });

    act(() => {
      rerender({ desired: null, tick: 1, isRotating: true });
    });

    expect(result.current).toBe('night');
  });
});
