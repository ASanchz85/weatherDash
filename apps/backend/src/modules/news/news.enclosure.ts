import { z } from 'zod';

import { dropDuplicateLinks, normalizeLink } from './news.dedupe.js';
import { cleanText, parsePublishedAt } from './news.sanitizer.js';
import type { ParsedNewsItem } from './news.types.js';

const httpUrl = z.url({ protocol: /^https?$/ });
const IMAGE_EXTENSION = /\.(?:jpe?g|png|webp|gif|avif)$/i;

// Con atributos activados, un elemento con atributos llega como objeto y su texto en `#text`.
const textNode = z.union([z.string(), z.object({ '#text': z.string().default('') }).transform((node) => node['#text'])]);

const enclosureSchema = z.object({ '@_url': httpUrl, '@_type': z.string().optional() });

const rawItemSchema = z.object({
  title: z.string(),
  link: httpUrl,
  description: textNode.optional(),
  enclosure: z.unknown(),
  guid: textNode.optional(),
  pubDate: z.string(),
  category: z.array(textNode).default([]),
});

/**
 * URL de la primera imagen entre los `enclosure` del item; algunos feeds añaden también vídeo o audio.
 * Sin `type`, se decide por la extensión. Devuelve `null` si no hay imagen utilizable.
 */
export function extractEnclosureImageUrl(enclosure: unknown): string | null {
  const candidates = Array.isArray(enclosure) ? enclosure : [enclosure];

  for (const candidate of candidates) {
    const parsed = enclosureSchema.safeParse(candidate);
    if (!parsed.success) continue;
    const { '@_url': url, '@_type': type } = parsed.data;
    const isImage =
      type === undefined ? IMAGE_EXTENSION.test(new URL(url).pathname) : type.toLowerCase().startsWith('image/');
    if (isImage) return url;
  }
  return null;
}

export interface EnclosureFeedRules {
  /** Texto de la descripción HTML del feed que se muestra, ya sin marcado. */
  describe(rawDescription: string): string;
  /** Categoría que se muestra entre las que publica el item. */
  pickCategory(categories: readonly string[]): string;
}

function adaptItem(raw: unknown, rules: EnclosureFeedRules): ParsedNewsItem | null {
  const parsed = rawItemSchema.safeParse(raw);
  if (!parsed.success) return null;
  const item = parsed.data;

  const enclosureUrl = extractEnclosureImageUrl(item.enclosure);
  const publishedAt = parsePublishedAt(item.pubDate);
  const title = cleanText(item.title);
  // Sin imagen, fecha o titular la noticia no se puede mostrar.
  if (enclosureUrl === null || publishedAt === null || title === '') return null;

  const link = normalizeLink(item.link);
  return {
    title,
    link,
    description: rules.describe(item.description ?? ''),
    enclosureUrl,
    guid: cleanText(item.guid ?? '') || link,
    publishedAt,
    category: rules.pickCategory(item.category),
  };
}

/** Adapta los `item` de feeds RSS con la foto en `enclosure`: descarta los inválidos y los enlaces repetidos. */
export function adaptEnclosureItems(rawItems: readonly unknown[], rules: EnclosureFeedRules): ParsedNewsItem[] {
  return dropDuplicateLinks(rawItems.flatMap((raw) => adaptItem(raw, rules) ?? []));
}
