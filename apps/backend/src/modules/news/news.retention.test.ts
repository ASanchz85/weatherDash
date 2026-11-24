import { describe, expect, it } from 'vitest';

import { startOfPreviousDay } from './news.retention.js';

describe('startOfPreviousDay', () => {
  it('devuelve la medianoche local del día anterior en invierno (UTC+1)', () => {
    const now = Date.UTC(2026, 10, 24, 9, 27);

    expect(new Date(startOfPreviousDay(now, 'Europe/Madrid')).toISOString()).toBe('2026-11-22T23:00:00.000Z');
  });

  it('devuelve la medianoche local del día anterior en verano (UTC+2)', () => {
    const now = Date.UTC(2026, 6, 10, 12);

    expect(new Date(startOfPreviousDay(now, 'Europe/Madrid')).toISOString()).toBe('2026-07-08T22:00:00.000Z');
  });

  it('usa la fecha local y no la UTC cuando difieren', () => {
    // 23:30 UTC del 24 ya es 00:30 del 25 en Madrid.
    const now = Date.UTC(2026, 10, 24, 23, 30);

    expect(new Date(startOfPreviousDay(now, 'Europe/Madrid')).toISOString()).toBe('2026-11-23T23:00:00.000Z');
  });

  it('respeta el cambio de hora entre la fecha actual y la objetivo', () => {
    // El 26/10/2026 termina el horario de verano: la medianoche del día 25 sigue siendo UTC+2.
    const now = Date.UTC(2026, 9, 26, 12);

    expect(new Date(startOfPreviousDay(now, 'Europe/Madrid')).toISOString()).toBe('2026-10-24T22:00:00.000Z');
  });
});
