import { describe, expect, it } from 'vitest';

import { buildHourly } from '../../test/weatherFixtures';
import type { HourlyForecast } from '../../types/weather';
import {
  buildChartPoints,
  buildLineSegments,
  formatHourLabel,
  isLabelledHour,
  toPolylinePoints,
} from './hourlyChart';

function hours(temperatures: (number | null)[]): HourlyForecast[] {
  return temperatures.map((temperature, index) => ({
    time: `2026-11-23T${String(index).padStart(2, '0')}:00`,
    temperature,
    precipitationProbability: 0,
    weatherCode: 3,
    icon: 'cloudy',
    isDay: false,
  }));
}

describe('formatHourLabel', () => {
  it('lee la hora del texto sin convertir zonas horarias', () => {
    expect(formatHourLabel('2026-11-23T18:00')).toBe('18:00');
    expect(formatHourLabel('2026-11-24T00:00')).toBe('00:00');
  });
});

describe('buildChartPoints', () => {
  it('coloca la temperatura más alta arriba y la más baja abajo, centradas en su columna', () => {
    const points = buildChartPoints(hours([5, 10, 7.5]));

    expect(points.map(({ x }) => x)).toEqual([0.5, 1.5, 2.5]);
    expect(points[1]!.y).toBeLessThan(points[2]!.y);
    expect(points[2]!.y).toBeLessThan(points[0]!.y);
  });

  it('mantiene la línea dentro de la zona de dibujo', () => {
    const points = buildChartPoints(buildHourly());

    for (const { y } of points) {
      expect(y).toBeGreaterThanOrEqual(38);
      expect(y).toBeLessThanOrEqual(82);
    }
  });

  it('centra la línea si la temperatura es constante', () => {
    const points = buildChartPoints(hours([8, 8, 8]));

    expect(new Set(points.map(({ y }) => y))).toEqual(new Set([60]));
  });

  it('omite las horas sin temperatura y devuelve vacío si no hay ninguna', () => {
    expect(buildChartPoints(hours([5, null, 7])).map(({ index }) => index)).toEqual([0, 2]);
    expect(buildChartPoints(hours([null, null]))).toEqual([]);
    expect(buildChartPoints([])).toEqual([]);
  });
});

describe('buildLineSegments', () => {
  it('une los puntos consecutivos en un solo tramo', () => {
    expect(buildLineSegments(buildChartPoints(hours([1, 2, 3])))).toHaveLength(1);
  });

  it('corta el trazo en los huecos de datos', () => {
    const segments = buildLineSegments(buildChartPoints(hours([1, 2, null, 4, null, null, 7])));

    expect(segments.map((segment) => segment.map(({ index }) => index))).toEqual([[0, 1], [3], [6]]);
  });

  it('devuelve una lista vacía sin puntos', () => {
    expect(buildLineSegments([])).toEqual([]);
  });
});

describe('toPolylinePoints', () => {
  it('serializa los puntos para un polyline', () => {
    expect(toPolylinePoints([{ x: 0.5, y: 40, temperature: 1, index: 0 }, { x: 1.5, y: 60, temperature: 0, index: 1 }])).toBe(
      '0.5,40 1.5,60',
    );
  });
});

describe('isLabelledHour', () => {
  it('rotula una de cada tres horas, empezando por la actual', () => {
    expect([0, 1, 2, 3, 6, 23].map(isLabelledHour)).toEqual([true, false, false, true, true, false]);
  });
});
