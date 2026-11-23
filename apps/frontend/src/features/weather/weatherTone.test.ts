import { describe, expect, it } from 'vitest';

import type { WeatherIconName } from '../../types/weather';
import { weatherTone } from './weatherTone';

describe('weatherTone', () => {
  it('destaca en naranja el cielo despejado de día', () => {
    expect(weatherTone('clear', true)).toBe('sun');
    expect(weatherTone('mostly-clear', true)).toBe('sun');
  });

  it('no destaca el cielo despejado de noche ni los cielos parcialmente nublados', () => {
    expect(weatherTone('clear', false)).toBe('neutral');
    expect(weatherTone('mostly-clear', false)).toBe('neutral');
    expect(weatherTone('partly-cloudy', true)).toBe('neutral');
  });

  it('destaca en azul todas las condiciones con lluvia, de día y de noche', () => {
    const rainy: WeatherIconName[] = ['drizzle', 'rain', 'sleet', 'showers', 'thunderstorm'];

    for (const icon of rainy) {
      expect(weatherTone(icon, true)).toBe('rain');
      expect(weatherTone(icon, false)).toBe('rain');
    }
  });

  it('deja sin destacar el resto de condiciones', () => {
    const others: WeatherIconName[] = ['cloudy', 'fog', 'snow', 'unknown'];

    for (const icon of others) expect(weatherTone(icon, true)).toBe('neutral');
  });
});
