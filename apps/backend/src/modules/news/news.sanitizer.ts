const CDATA_MARKERS = /<!\[CDATA\[|\]\]>/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const HTML_TAG = /<\/?[a-z][^>]*>/gi;
const WHITESPACE = /\s+/g;
// Quitar una etiqueta en línea (`<b>Ibex</b>.`) deja un espacio delante del signo.
const SPACE_BEFORE_PUNCTUATION = / ([.,;:!?)])/g;
// Controles (Cc) y caracteres de formato invisibles (Cf: ancho cero, BOM, guion blando).
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;
const ENTITY = /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi;

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  laquo: '«',
  raquo: '»',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  euro: '€',
};

function decodeEntity(match: string, body: string): string {
  const named = NAMED_ENTITIES[body.toLowerCase()];
  if (named !== undefined) return named;
  if (!body.startsWith('#')) return match;

  const codePoint = body[1]?.toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return match;
  }
}

/** Deja un texto listo para mostrarse: sin restos de CDATA, marcado HTML, entidades ni caracteres invisibles. */
export function cleanText(value: string): string {
  return value
    .replace(ENTITY, decodeEntity)
    .replace(CDATA_MARKERS, ' ')
    .replace(HTML_COMMENT, ' ')
    .replace(HTML_TAG, ' ')
    .replace(WHITESPACE, ' ')
    .replace(INVISIBLE, '')
    .replace(SPACE_BEFORE_PUNCTUATION, '$1')
    .trim();
}

/** Se queda con la primera categoría que quede con contenido tras la limpieza. */
export function cleanCategory(categories: readonly string[]): string {
  return categories.map(cleanText).find((category) => category !== '') ?? '';
}

/** Convierte la fecha RFC 822 del feed a milisegundos desde epoch; `null` si no es válida. */
export function parsePublishedAt(value: string): number | null {
  const timestamp = Date.parse(cleanText(value));
  return Number.isNaN(timestamp) ? null : timestamp;
}

const TRAILING_ELLIPSIS = /\s*(?:\.{3}|…)$/;
const CLOSING_MARKS = '["\'”’»)\\]]*';
const ENDS_SENTENCE = new RegExp(`[.!?]${CLOSING_MARKS}$`);
// Una inicial suelta («M. Márquez») no cierra la frase.
const SENTENCE_BOUNDARY = new RegExp(`(?<![\\s(]\\p{L})[.!?]${CLOSING_MARKS}(?=\\s)`, 'gu');

/**
 * Recorta un texto ya limpio hasta su última frase completa, para no mostrar resúmenes cortados a mitad de frase.
 * Si no hay ninguna frase completa, lo devuelve tal cual.
 */
export function trimToLastSentence(text: string): string {
  const body = text.replace(TRAILING_ELLIPSIS, '');
  if (ENDS_SENTENCE.test(body)) return body;

  const lastBoundary = [...body.matchAll(SENTENCE_BOUNDARY)].at(-1);
  return lastBoundary ? body.slice(0, lastBoundary.index + lastBoundary[0].length) : text;
}
