import { LOCALE } from '../../config';

const PLACEHOLDER = '—';

const timeFormatter = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dayMonthFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });

export function formatTemperature(value: number | null): string {
  return value === null ? PLACEHOLDER : `${Math.round(value)}°`;
}

export function formatPercentage(value: number | null): string {
  return value === null ? PLACEHOLDER : `${Math.round(value)}%`;
}

export function formatWindSpeed(value: number): string {
  return `${Math.round(value)} km/h`;
}

/** Hora de la última actualización; incluye el día si no es hoy. */
export function formatUpdatedAt(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const time = timeFormatter.format(date);
  return date.toDateString() === now.toDateString() ? time : `${dayMonthFormatter.format(date)}, ${time}`;
}
