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
