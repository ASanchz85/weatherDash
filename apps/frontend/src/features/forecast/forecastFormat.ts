import { LOCALE } from '../../config';
import { capitalize } from '../clock/dateTimeFormat';

// La fecha de la API es local de la localidad: se interpreta en UTC para que el día no dependa de la zona del navegador.
const weekdayFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' });

/** Día de la semana abreviado («Lun») a partir de una fecha YYYY-MM-DD. */
export function formatWeekdayShort(isoDate: string): string {
  return capitalize(weekdayFormatter.format(new Date(`${isoDate}T00:00:00Z`)).replace('.', ''));
}
