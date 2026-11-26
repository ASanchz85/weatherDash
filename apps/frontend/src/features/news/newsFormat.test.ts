import { describe, expect, it } from 'vitest';

import { formatPublishedAt, splitCommemorationDate } from './newsFormat';

describe('splitCommemorationDate', () => {
  it('separa el día y el mes del año', () => {
    expect(splitCommemorationDate('26 de noviembre de 2018')).toEqual({ dayMonth: '26 de noviembre', year: '2018' });
    expect(splitCommemorationDate('1 de mayo de 988')).toEqual({ dayMonth: '1 de mayo', year: '988' });
  });

  it('devuelve null si la fecha no tiene el formato esperado', () => {
    expect(splitCommemorationDate('Internacional')).toBeNull();
    expect(splitCommemorationDate('26 de noviembre')).toBeNull();
  });
});

describe('formatPublishedAt', () => {
  it('muestra día, mes abreviado y hora local de 24 horas', () => {
    // La zona horaria de los tests es Europe/Madrid (UTC+1 en noviembre).
    expect(formatPublishedAt('2026-11-24T07:32:49.000Z')).toMatch(/^24 nov,? 08:32$/);
  });
});
