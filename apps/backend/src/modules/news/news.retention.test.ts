import { describe, expect, it } from 'vitest';

import { localDate, nextDailyRun, startOfDay, startOfPreviousDay } from './news.retention.js';

describe('nextDailyRun', () => {
  it('devuelve las 00:01 locales de hoy si todavía no han llegado', () => {
    // 00:00:30 del 25 en Madrid.
    const now = Date.UTC(2026, 10, 24, 23, 0, 30);

    expect(new Date(nextDailyRun(now, 'Europe/Madrid', 1)).toISOString()).toBe('2026-11-24T23:01:00.000Z');
  });

  it('devuelve las 00:01 locales de mañana si ya han pasado', () => {
    // 10:00 del 24 en Madrid.
    const now = Date.UTC(2026, 10, 24, 9);

    expect(new Date(nextDailyRun(now, 'Europe/Madrid', 1)).toISOString()).toBe('2026-11-24T23:01:00.000Z');
  });

  it('pasa al día siguiente justo a las 00:01', () => {
    const now = Date.UTC(2026, 10, 24, 23, 1);

    expect(new Date(nextDailyRun(now, 'Europe/Madrid', 1)).toISOString()).toBe('2026-11-25T23:01:00.000Z');
  });

  it('respeta el horario de verano (UTC+2)', () => {
    const now = Date.UTC(2026, 6, 10, 12);

    expect(new Date(nextDailyRun(now, 'Europe/Madrid', 1)).toISOString()).toBe('2026-07-10T22:01:00.000Z');
  });
});

describe('startOfDay', () => {
  it('devuelve la medianoche local del día actual', () => {
    const now = Date.UTC(2026, 10, 24, 23, 30);

    expect(new Date(startOfDay(now, 'Europe/Madrid')).toISOString()).toBe('2026-11-24T23:00:00.000Z');
  });
});

describe('localDate', () => {
  it('usa la fecha local y no la UTC cuando difieren', () => {
    expect(localDate(Date.UTC(2026, 10, 25, 23, 30), 'Europe/Madrid')).toEqual({ year: 2026, month: 11, day: 26 });
  });
});

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
