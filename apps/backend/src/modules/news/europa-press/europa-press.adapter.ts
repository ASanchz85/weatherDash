import { z } from 'zod';

import type { ParsedNewsItem } from '../news.types.js';

const httpUrl = z.url({ protocol: /^https?$/ });
const requiredText = z.string().trim().min(1);

const itemSchema = z.object({
  title: requiredText,
  link: httpUrl,
  description: z.string().trim().default(''),
  enclosure: z.object({ '@_url': httpUrl }),
  // Con atributos activados, guid llega como objeto cuando lleva isPermaLink.
  guid: z.union([requiredText, z.object({ '#text': requiredText })]).optional(),
  pubDate: z
    .string()
    .transform((value) => Date.parse(value))
    .refine((value) => !Number.isNaN(value)),
  category: z.string().trim().default(''),
});

/** Convierte los `item` crudos del RSS de Europa Press al formato de la base de datos; los inválidos se descartan. */
export function adaptEuropaPressItems(rawItems: readonly unknown[]): ParsedNewsItem[] {
  return rawItems.flatMap((raw) => {
    const item = itemSchema.safeParse(raw);
    if (!item.success) return [];
    const { title, link, description, enclosure, guid, pubDate, category } = item.data;
    return [
      {
        title,
        link,
        description,
        enclosureUrl: enclosure['@_url'],
        guid: typeof guid === 'string' ? guid : (guid?.['#text'] ?? link),
        publishedAt: pubDate,
        category,
      },
    ];
  });
}
