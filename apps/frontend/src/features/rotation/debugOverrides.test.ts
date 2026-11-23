import { describe, expect, it } from 'vitest';

import { parseDebugOverrides } from './debugOverrides';

describe('parseDebugOverrides', () => {
  it('lee la página fijada', () => {
    expect(parseDebugOverrides('?page=1')).toEqual({ page: 1, theme: null });
    expect(parseDebugOverrides('?page=0')).toEqual({ page: 0, theme: null });
  });

  it('lee el tema forzado', () => {
    expect(parseDebugOverrides('?theme=night')).toEqual({ page: null, theme: 'night' });
    expect(parseDebugOverrides('?page=1&theme=day')).toEqual({ page: 1, theme: 'day' });
  });

  it('ignora valores ausentes o no válidos', () => {
    expect(parseDebugOverrides('')).toEqual({ page: null, theme: null });
    expect(parseDebugOverrides('?page=abc')).toEqual({ page: null, theme: null });
    expect(parseDebugOverrides('?page=-1')).toEqual({ page: null, theme: null });
    expect(parseDebugOverrides('?page=1.5')).toEqual({ page: null, theme: null });
    expect(parseDebugOverrides('?theme=sunset')).toEqual({ page: null, theme: null });
  });
});
