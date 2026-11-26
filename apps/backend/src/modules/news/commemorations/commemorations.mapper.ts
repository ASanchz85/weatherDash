import { z } from 'zod';

import { cleanText } from '../expansion/expansion.sanitizer.js';
import type { LocalDate } from '../news.retention.js';
import type { ParsedNewsItem } from '../news.types.js';
import { pageSchema, pickPhoto, type WikipediaPage } from './commemorations.photo.js';

/** Máximo de efemérides con foto que se guardan por día. */
export const MAX_COMMEMORATIONS = 15;
const MIN_TEXT_LENGTH = 15;

const eventSchema = z.object({
  text: z.string(),
  year: z.number().int().positive(),
  pages: z.array(z.unknown()).default([]),
});

export interface CommemorationsContext {
  date: LocalDate;
  /** Inicio del día local: las efemérides solo valen hoy, así que es su fecha de publicación. */
  publishedAt: number;
}

const dayMonthFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' });

function dayMonth({ month, day }: LocalDate): string {
  return dayMonthFormat.format(new Date(Date.UTC(2000, month - 1, day)));
}

function normalizeText(raw: string): string | null {
  const text = cleanText(raw);
  // Wikipedia trae textos como «acontecimientos en torno a…:» que son solo una introducción.
  if (text.length < MIN_TEXT_LENGTH || text.endsWith(':')) return null;
  const sentence = text.charAt(0).toUpperCase() + text.slice(1);
  return /[\p{L}\p{N}]$/u.test(sentence) ? `${sentence}.` : sentence;
}

/** Convierte los eventos de «tal día como hoy» de Wikipedia en noticias; los que no tienen foto se descartan. */
export function adaptCommemorations(events: readonly unknown[], { date, publishedAt }: CommemorationsContext): ParsedNewsItem[] {
  const seen = new Set<string>();
  const usedPhotos = new Set<string>();
  const items: ParsedNewsItem[] = [];
  const dayLabel = dayMonth(date);

  const parsed = events.flatMap((raw, index) => {
    const event = eventSchema.safeParse(raw);
    return event.success ? [{ ...event.data, index }] : [];
  });
  // Primero los más recientes, que son los más cercanos al espectador.
  parsed.sort((a, b) => b.year - a.year || a.index - b.index);

  for (const event of parsed) {
    if (items.length >= MAX_COMMEMORATIONS) break;

    const text = normalizeText(event.text);
    if (text === null || seen.has(text.toLowerCase())) continue;

    const pages = event.pages.flatMap((page): WikipediaPage[] => {
      const result = pageSchema.safeParse(page);
      return result.success ? [result.data] : [];
    });
    const photo = pickPhoto(pages, usedPhotos);
    if (photo === null) continue;

    seen.add(text.toLowerCase());
    usedPhotos.add(photo.url);
    const link = `${photo.pageUrl ?? `https://es.wikipedia.org/wiki/${dayLabel.replace(/ /g, '_')}`}#${event.year}-${event.index}`;
    items.push({
      title: text,
      link,
      description: text,
      enclosureUrl: photo.url,
      guid: link,
      publishedAt,
      category: `${dayLabel} de ${event.year}`,
    });
  }

  // La rotación entrega primero lo insertado más tarde: se inserta de más antiguo a más reciente.
  return items.reverse();
}
