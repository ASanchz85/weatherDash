import type { HourlyForecast } from '../../types/weather';

/** Cada cuántas horas se rotulan la temperatura y la hora en la gráfica. */
export const LABEL_EVERY_HOURS = 3;

/** Zona vertical (en % de la altura) donde se dibuja la línea; deja hueco arriba para rótulos y leyenda. */
const LINE_TOP_PERCENT = 38;
const LINE_BOTTOM_PERCENT = 82;

export interface ChartPoint {
  /** Posición horizontal en unidades de columna (centro de la columna de la hora). */
  x: number;
  /** Posición vertical en % de la altura del área de dibujo (0 = arriba). */
  y: number;
  temperature: number;
  index: number;
}

/** Hora local (HH:mm) leída del texto: la fecha de la API ya es local, sin conversiones de zona horaria. */
export function formatHourLabel(time: string): string {
  return time.slice(11, 16);
}

/** Puntos de la línea de temperatura; las horas sin dato no tienen punto. */
export function buildChartPoints(hourly: readonly HourlyForecast[]): ChartPoint[] {
  const known = hourly.flatMap(({ temperature }, index) => (temperature === null ? [] : [{ temperature, index }]));
  if (known.length === 0) return [];

  const temperatures = known.map(({ temperature }) => temperature);
  const min = Math.min(...temperatures);
  const range = Math.max(...temperatures) - min;
  const span = LINE_BOTTOM_PERCENT - LINE_TOP_PERCENT;

  return known.map(({ temperature, index }) => ({
    x: index + 0.5,
    // Con temperatura constante la línea queda centrada en la zona de dibujo.
    y: range === 0 ? LINE_TOP_PERCENT + span / 2 : LINE_BOTTOM_PERCENT - ((temperature - min) / range) * span,
    temperature,
    index,
  }));
}

/** Tramos continuos de la línea: un hueco de datos corta el trazo en lugar de unir los puntos vecinos. */
export function buildLineSegments(points: readonly ChartPoint[]): ChartPoint[][] {
  const segments: ChartPoint[][] = [];
  for (const point of points) {
    const current = segments.at(-1);
    const previous = current?.at(-1);
    if (current && previous && point.index === previous.index + 1) current.push(point);
    else segments.push([point]);
  }
  return segments;
}

/** Atributo `points` de un polyline en el espacio del viewBox (ancho = nº de horas, alto = 100). */
export function toPolylinePoints(segment: readonly ChartPoint[]): string {
  return segment.map(({ x, y }) => `${x},${y}`).join(' ');
}

export function isLabelledHour(index: number): boolean {
  return index % LABEL_EVERY_HOURS === 0;
}
