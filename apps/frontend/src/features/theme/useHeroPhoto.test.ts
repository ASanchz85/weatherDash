import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useHeroPhoto } from './useHeroPhoto';

describe('useHeroPhoto', () => {
  it('cambia de foto en cada rotaci\u00f3n sin repetir ninguna de las dos \u00faltimas', () => {
    const { result, rerender } = renderHook(({ key }) => useHeroPhoto('day', key, true), {
      initialProps: { key: 0 },
    });

    const used = [result.current];
    for (let key = 1; key <= 40; key += 1) {
      rerender({ key });
      used.push(result.current);
    }

    for (let index = 1; index < used.length; index += 1) {
      expect(used[index]).not.toBe(used[index - 1]);
      if (index >= 2) expect(used[index]).not.toBe(used[index - 2]);
    }
  });

  it('no cambia de foto mientras la vista no est\u00e1 activa y cambia al volver', () => {
    const { result, rerender } = renderHook(({ key, active }) => useHeroPhoto('day', key, active), {
      initialProps: { key: 0, active: true },
    });
    const first = result.current;

    rerender({ key: 1, active: false });
    rerender({ key: 2, active: false });
    expect(result.current).toBe(first);

    rerender({ key: 2, active: true });
    expect(result.current).not.toBe(first);
  });

  it('con la misma rotaci\u00f3n mantiene la foto', () => {
    const { result, rerender } = renderHook(({ key }) => useHeroPhoto('night', key, true), {
      initialProps: { key: 3 },
    });
    const first = result.current;

    act(() => rerender({ key: 3 }));
    expect(result.current).toBe(first);
  });
});
