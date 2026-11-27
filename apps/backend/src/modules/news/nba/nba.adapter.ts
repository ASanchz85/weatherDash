import { adaptEnclosureItems } from '../news.enclosure.js';
import { cleanCategory, cleanText } from '../news.sanitizer.js';
import type { ParsedNewsItem } from '../news.types.js';

// WordPress añade al resumen la miniatura, un enlace de vuelta al artículo y la firma del medio.
const BACKLINK_PARAGRAPH = /<p>\s*La entrada\b[\s\S]*?<\/p>/gi;
const SOURCE_FOOTER = /<div>\s*<em>\s*Source:[\s\S]*?<\/em>\s*<\/div>/gi;

function describe(rawDescription: string): string {
  return cleanText(rawDescription.replace(BACKLINK_PARAGRAPH, '').replace(SOURCE_FOOTER, ''));
}

/** La primera categoría es la sección (Noticias, Artículos, Rumores NBA…); el resto son equipos y jugadores. */
export function adaptNbaItems(rawItems: readonly unknown[]): ParsedNewsItem[] {
  return adaptEnclosureItems(rawItems, { describe, pickCategory: cleanCategory });
}
