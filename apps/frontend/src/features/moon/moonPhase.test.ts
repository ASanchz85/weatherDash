import { describe, expect, it } from 'vitest';

import { describeMoonPhase, getMoonPhase } from './moonPhase';

describe('getMoonPhase', () => {
  it('reconoce la luna nueva del 6 de enero de 2000 (18:14 UTC)', () => {
    const phase = getMoonPhase(new Date('2000-01-06T18:14:00Z'));

    expect(phase.name).toBe('new');
    expect(phase.illumination).toBeLessThan(0.01);
  });

  it('reconoce la luna llena del 24 de noviembre de 2026', () => {
    const phase = getMoonPhase(new Date('2026-11-24T14:53:00Z'));

    expect(phase.name).toBe('full');
    expect(phase.illumination).toBeGreaterThan(0.99);
  });

  it('el 26 de noviembre de 2026 a las 00:10 está gibosa menguante y ~97 % iluminada', () => {
    const phase = getMoonPhase(new Date('2026-11-25T23:10:00Z'));

    expect(phase.name).toBe('waning-gibbous');
    expect(phase.waxing).toBe(false);
    expect(phase.illumination).toBeCloseTo(0.974, 1);
  });

  it('antes de la luna llena está gibosa creciente', () => {
    const phase = getMoonPhase(new Date('2026-11-20T12:00:00Z'));

    expect(phase.name).toBe('waxing-gibbous');
    expect(phase.waxing).toBe(true);
    expect(phase.illumination).toBeGreaterThan(0.5);
  });

  it('recorre las ocho fases en orden a lo largo de un mes lunar', () => {
    const start = Date.UTC(2026, 10, 9);
    const names: string[] = [];
    for (let day = 0; day < 30; day += 1) {
      const { name } = getMoonPhase(new Date(start + day * 86_400_000));
      if (names.at(-1) !== name) names.push(name);
    }

    expect(names).toEqual([
      'new',
      'waxing-crescent',
      'first-quarter',
      'waxing-gibbous',
      'full',
      'waning-gibbous',
      'last-quarter',
      'waning-crescent',
      'new',
    ]);
  });
});

describe('describeMoonPhase', () => {
  it('compone el nombre de la fase y el porcentaje iluminado', () => {
    expect(describeMoonPhase({ name: 'waning-gibbous', illumination: 0.9738, waxing: false })).toBe(
      'Luna gibosa menguante · 97 %',
    );
  });
});
