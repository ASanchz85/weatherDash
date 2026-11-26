import { describe, expect, it } from 'vitest';

import { formatCommemorationsTitle, formatPublishedAt } from './newsFormat';

describe('formatCommemorationsTitle', () => {
  it('compone el título de la card con el día y el mes completos', () => {
    expect(formatCommemorationsTitle(new Date('2026-11-26T12:00:00Z'))).toBe('Tal día como hoy 26 de noviembre ...');
  });
});

describe('formatPublishedAt', () => {
  it('muestra día, mes abreviado y hora local de 24 horas', () => {
    // La zona horaria de los tests es Europe/Madrid (UTC+1 en noviembre).
    expect(formatPublishedAt('2026-11-24T07:32:49.000Z')).toMatch(/^24 nov,? 08:32$/);
  });
});
