import { describe, expect, it } from 'vitest';

import { temperatureStyle, temperatureTone } from './temperatureTone';

describe('temperatureTone', () => {
  it.each([
    [40, 'hot'],
    [36.6, 'hot'],
    [36, 'warm'],
    [30, 'warm'],
    [29, 'mild'],
    [23, 'mild'],
    [22, 'neutral'],
    [12, 'neutral'],
    [11, 'cool'],
    [7, 'cool'],
    [4, 'cold'],
    [0, 'cold'],
    [-1, 'freezing'],
    [-12, 'freezing'],
  ] as const)('%d° es %s', (value, tone) => {
    expect(temperatureTone(value)).toBe(tone);
  });

  it('usa el valor redondeado que se muestra', () => {
    expect(temperatureTone(36.4)).toBe('warm');
    expect(temperatureTone(11.6)).toBe('neutral');
    expect(temperatureTone(-0.4)).toBe('cold');
    expect(temperatureTone(6.6)).toBe('cool');
  });

  it('no colorea la ausencia de dato', () => {
    expect(temperatureTone(null)).toBe('neutral');
  });
});

describe('temperatureStyle', () => {
  it('devuelve el color del tramo y nada para el blanco por defecto', () => {
    expect(temperatureStyle(40)).toEqual({ color: 'var(--temp-hot)' });
    expect(temperatureStyle(-3)).toEqual({ color: 'var(--temp-freezing)' });
    expect(temperatureStyle(18)).toBeUndefined();
    expect(temperatureStyle(null)).toBeUndefined();
  });
});
