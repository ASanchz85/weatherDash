import { describe, expect, it } from 'vitest';

import { HERO_PHOTOS, pickHeroPhoto } from './heroPhotos';

const photos = { day: ['d1', 'd2', 'd3'], night: ['n1'] } as const;

describe('pickHeroPhoto', () => {
  it('elige una foto del tema indicado', () => {
    expect(pickHeroPhoto('day', [], () => 0, photos)).toBe('d1');
    expect(pickHeroPhoto('day', [], () => 0.99, photos)).toBe('d3');
    expect(pickHeroPhoto('night', [], () => 0.5, photos)).toBe('n1');
  });

  it('no repite ninguna de las fotos recientes si quedan otras', () => {
    const five = { day: ['a', 'b', 'c', 'd', 'e'], night: [] } as const;
    for (const random of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      expect(['c', 'd']).not.toContain(pickHeroPhoto('day', ['c', 'd'], () => random, five));
    }
  });

  it('con pocas fotos relaja la regla y evita al menos la última', () => {
    for (const random of [0, 0.4, 0.7, 0.99]) {
      expect(pickHeroPhoto('day', ['d1', 'd2', 'd3'], () => random, photos)).not.toBe('d3');
    }
  });

  it('repite la única foto disponible y devuelve null si no hay ninguna', () => {
    expect(pickHeroPhoto('night', ['n1'], () => 0.5, photos)).toBe('n1');
    expect(pickHeroPhoto('day', [], () => 0.5, { day: [], night: [] })).toBeNull();
  });
});

describe('HERO_PHOTOS', () => {
  it('incluye las fotos webp de las carpetas day y night', () => {
    expect(HERO_PHOTOS.day.length).toBeGreaterThan(1);
    expect(HERO_PHOTOS.night.length).toBeGreaterThan(1);
    expect([...HERO_PHOTOS.day, ...HERO_PHOTOS.night].every((url) => url.includes('.webp'))).toBe(true);
  });
});
