import { describe, expect, it } from 'vitest';

import { formatWeekdayShort } from './forecastFormat';

describe('formatWeekdayShort', () => {
  it('devuelve el día de la semana abreviado y capitalizado', () => {
    expect(formatWeekdayShort('2026-11-23')).toBe('Lun');
    expect(formatWeekdayShort('2026-11-24')).toBe('Mar');
    expect(formatWeekdayShort('2026-11-29')).toBe('Dom');
  });
});
