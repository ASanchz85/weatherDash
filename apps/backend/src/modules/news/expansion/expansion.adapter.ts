import { z } from 'zod';

import type { ParsedNewsItem } from '../news.types.js';
import { dropDuplicateLinks, normalizeLink } from './expansion.dedupe.js';
import { extractImageUrl } from './expansion.image.js';
import { cleanCategory, cleanText, parsePublishedAt } from './expansion.sanitizer.js';

// Con atributos activados, un elemento con atributos llega como objeto y su texto en `#text`.
const textNode = z.union([z.string(), z.object({ '#text': z.string().default('') }).transform((node) => node['#text'])]);

const rawItemSchema = z.object({
  title: z.string(),
  link: z.url({ protocol: /^https?$/ }),
  'media:description': textNode.optional(),
  'media:content': z.unknown(),
  guid: textNode.optional(),
  pubDate: z.string(),
  category: z.array(textNode).default([]),
});

function adaptItem(raw: unknown): ParsedNewsItem | null {
  const parsed = rawItemSchema.safeParse(raw);
  if (!parsed.success) return null;
  const item = parsed.data;

  const enclosureUrl = extractImageUrl(item['media:content']);
  const publishedAt = parsePublishedAt(item.pubDate);
  const title = cleanText(item.title);
  // Sin imagen, fecha o titular la noticia no se puede mostrar.
  if (enclosureUrl === null || publishedAt === null || title === '') return null;

  const link = normalizeLink(item.link);
  return {
    title,
    link,
    description: cleanText(item['media:description'] ?? ''),
    enclosureUrl,
    guid: cleanText(item.guid ?? '') || link,
    publishedAt,
    category: cleanCategory(item.category),
  };
}

/** Convierte los `item` crudos del RSS de Expansión al formato de la base de datos, sin inválidos ni duplicados. */
export function adaptExpansionItems(rawItems: readonly unknown[]): ParsedNewsItem[] {
  return dropDuplicateLinks(rawItems.flatMap((raw) => adaptItem(raw) ?? []));
}
