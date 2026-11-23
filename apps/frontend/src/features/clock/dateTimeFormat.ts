import { LOCALE } from '../../config';

// Se reutilizan las instancias: crear formateadores Intl en cada render es costoso.
const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const weekdayFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });

const fullDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export interface FormattedTime {
  hours: string;
  minutes: string;
  seconds: string;
}

export interface FormattedDate {
  weekday: string;
  fullDate: string;
}

export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1);
}

export function formatTime(date: Date): FormattedTime {
  const parts = timeFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';

  return { hours: part('hour'), minutes: part('minute'), seconds: part('second') };
}

export function formatDate(date: Date): FormattedDate {
  return {
    weekday: capitalize(weekdayFormatter.format(date)),
    fullDate: fullDateFormatter.format(date),
  };
}
