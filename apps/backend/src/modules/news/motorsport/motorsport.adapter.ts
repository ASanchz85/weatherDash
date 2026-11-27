import { adaptEnclosureItems } from '../news.enclosure.js';
import { cleanCategory, cleanText, trimToLastSentence } from '../news.sanitizer.js';
import type { ParsedNewsItem } from '../news.types.js';

// El resumen acaba con un enlace «Sigue leyendo» que no aporta nada en pantalla.
const READ_MORE_LINK = /<a\b[^>]*class=['"]more['"][^>]*>[\s\S]*?<\/a>/gi;
// Tras el primer párrafo vienen bloques de enlaces relacionados («Recuerda:», «Apunta:», «SÍGUELO EN DIRECTO:»…).
const RELATED_LINKS_BLOCK = /<br\s*\/?>\s*[^<:]{1,40}:\s*(?:<br\s*\/?>|$)/i;

function describe(rawDescription: string): string {
  const withoutLink = rawDescription.replace(READ_MORE_LINK, '');
  const block = RELATED_LINKS_BLOCK.exec(withoutLink);
  const summary = block ? withoutLink.slice(0, block.index) : withoutLink;
  // El feed corta el resumen a mitad de frase.
  return trimToLastSentence(cleanText(summary));
}

/** Motorsport.com publica primero el circuito y al final la serie (MotoGP, Fórmula 1…), que es la que interesa. */
function pickCategory(categories: readonly string[]): string {
  return cleanCategory([...categories].reverse());
}

/** Convierte los `item` crudos del RSS de Motorsport.com al formato de la base de datos, sin inválidos ni duplicados. */
export function adaptMotorsportItems(rawItems: readonly unknown[]): ParsedNewsItem[] {
  return adaptEnclosureItems(rawItems, { describe, pickCategory });
}
