import { describe, expect, it } from 'vitest';

import { formatDate, formatTime } from './dateTimeFormat';

// Las pruebas se ejecutan con TZ=Europe/Madrid (ver vite.config.ts).
describe('formatTime', () => {
  it('devuelve horas, minutos y segundos con dos dígitos en formato 24 h', () => {
    expect(formatTime(new Date('2026-11-23T16:05:09+01:00'))).toEqual({
      hours: '16',
      minutes: '05',
      seconds: '09',
    });
  });

  it('representa la medianoche como 00', () => {
    expect(formatTime(new Date('2026-11-23T00:00:00+01:00')).hours).toBe('00');
  });
});

describe('formatDate', () => {
  it('formatea la fecha en español con el día de la semana capitalizado', () => {
    expect(formatDate(new Date('2026-11-23T12:00:00+01:00'))).toEqual({
      weekday: 'Lunes',
      fullDate: '23 de noviembre de 2026',
    });
  });
});
