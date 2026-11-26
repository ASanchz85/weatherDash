import { LOCALE } from '../../config';

const publishedFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Fecha y hora de publicación para la metadata de la noticia, por ejemplo «24 nov, 08:32». */
export function formatPublishedAt(isoDate: string): string {
  return publishedFormatter.format(new Date(isoDate));
}

export interface CommemorationDate {
  /** Por ejemplo «26 de noviembre». */
  dayMonth: string;
  year: string;
}

const COMMEMORATION_DATE = /^(.+) de (\d{1,4})$/;

/** Separa la fecha de una efeméride («26 de noviembre de 2018») en día y mes por un lado y año por otro. */
export function splitCommemorationDate(label: string): CommemorationDate | null {
  const match = COMMEMORATION_DATE.exec(label.trim());
  return match?.[1] && match[2] ? { dayMonth: match[1], year: match[2] } : null;
}
