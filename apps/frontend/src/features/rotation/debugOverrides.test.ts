import { describe, expect, it } from 'vitest';

import { parseDebugOverrides } from './debugOverrides';

const NONE = { page: null, theme: null, feed: null };

describe('parseDebugOverrides', () => {
  it('lee la página fijada', () => {
    expect(parseDebugOverrides('?page=1')).toEqual({ ...NONE, page: 1 });
    expect(parseDebugOverrides('?page=0')).toEqual({ ...NONE, page: 0 });
  });

  it('lee el tema forzado', () => {
    expect(parseDebugOverrides('?theme=night')).toEqual({ ...NONE, theme: 'night' });
    expect(parseDebugOverrides('?page=1&theme=day')).toEqual({ ...NONE, page: 1, theme: 'day' });
  });

  it('lee el feed de noticias fijado', () => {
    expect(parseDebugOverrides('?feed=markets')).toEqual({ ...NONE, feed: 'markets' });
    expect(parseDebugOverrides('?feed=economy')).toEqual({ ...NONE, feed: 'economy' });
  });

  it('ignora valores ausentes o no válidos', () => {
    expect(parseDebugOverrides('')).toEqual(NONE);
    expect(parseDebugOverrides('?page=abc')).toEqual(NONE);
    expect(parseDebugOverrides('?page=-1')).toEqual(NONE);
    expect(parseDebugOverrides('?page=1.5')).toEqual(NONE);
    expect(parseDebugOverrides('?theme=sunset')).toEqual(NONE);
    expect(parseDebugOverrides('?feed=deportes')).toEqual(NONE);
  });
});
