import { describe, expect, it } from 'vitest';

import { formatPublishedAt } from './newsFormat';

describe('formatPublishedAt', () => {
  it('muestra día, mes abreviado y hora local de 24 horas', () => {
    // La zona horaria de los tests es Europe/Madrid (UTC+1 en noviembre).
    expect(formatPublishedAt('2026-11-24T07:32:49.000Z')).toMatch(/^24 nov,? 08:32$/);
  });
});
