import { describe, expect, it } from 'vitest';

import { parseDebugOverrides } from './debugOverrides';

describe('parseDebugOverrides', () => {
  it('lee la página fijada', () => {
    expect(parseDebugOverrides('?page=1')).toEqual({ page: 1 });
    expect(parseDebugOverrides('?page=0')).toEqual({ page: 0 });
  });

  it('ignora valores ausentes o no válidos', () => {
    expect(parseDebugOverrides('')).toEqual({ page: null });
    expect(parseDebugOverrides('?page=abc')).toEqual({ page: null });
    expect(parseDebugOverrides('?page=-1')).toEqual({ page: null });
    expect(parseDebugOverrides('?page=1.5')).toEqual({ page: null });
  });
});
