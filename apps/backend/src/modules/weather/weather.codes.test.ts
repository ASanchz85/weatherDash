import { describe, expect, it } from 'vitest';

import { interpretWeatherCode } from './weather.codes.js';

describe('interpretWeatherCode', () => {
  it.each([
    [0, 'Despejado', 'clear'],
    [2, 'Parcialmente nuboso', 'partly-cloudy'],
    [45, 'Niebla', 'fog'],
    [63, 'Lluvia moderada', 'rain'],
    [75, 'Nevada intensa', 'snow'],
    [81, 'Chubascos moderados', 'showers'],
    [99, 'Tormenta con granizo fuerte', 'thunderstorm'],
  ])('traduce el código WMO %i', (code, description, icon) => {
    expect(interpretWeatherCode(code)).toEqual({ description, icon });
  });

  it('devuelve una condición desconocida para códigos no contemplados', () => {
    expect(interpretWeatherCode(42)).toEqual({ description: 'Condición desconocida', icon: 'unknown' });
  });
});
