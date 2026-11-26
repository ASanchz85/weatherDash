import { z } from 'zod';

const MIN_WIDTH = 500;
const MIN_HEIGHT = 350;
const TARGET_WIDTH = 960;
const PHOTO_EXTENSION = /\.(jpe?g|png|webp)$/i;
const SVG_ANYWHERE = /\.svg/i;
// Un fichero con alguna de estas palabras es un símbolo, un mapa o un montaje, no una fotografía.
const NON_PHOTO_WORDS = new Set([
  'flag',
  'flags',
  'bandera',
  'logo',
  'logos',
  'wordmark',
  'escudo',
  'arms',
  'coat',
  'seal',
  'emblem',
  'icon',
  'map',
  'mapa',
  'locator',
  'location',
  'diagram',
  'chart',
  'collage',
  'montage',
]);
const ORIGINAL_URL = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[a-z-]+)\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/i;
const THUMBNAIL_WIDTH = /\/(\d+)px-[^/]+$/;

const imageSchema = z.object({ source: z.string(), width: z.number(), height: z.number() });

export const pageSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  content_urls: z.object({ desktop: z.object({ page: z.string() }) }).optional(),
  thumbnail: imageSchema.optional(),
  originalimage: imageSchema.optional(),
});

export type WikipediaPage = z.infer<typeof pageSchema>;

export interface Photo {
  url: string;
  width: number;
  height: number;
  /** Página de Wikipedia de la que sale la foto. */
  pageUrl: string | undefined;
}

function fileName(url: string): string {
  const path = url.split('?')[0] ?? '';
  try {
    return decodeURIComponent(path.split('/').at(-1) ?? '');
  } catch {
    return path;
  }
}

function isPhoto(image: z.infer<typeof imageSchema>): boolean {
  const path = image.source.split('?')[0] ?? '';
  if (SVG_ANYWHERE.test(path) || !PHOTO_EXTENSION.test(path)) return false;
  if (image.width < MIN_WIDTH || image.height < MIN_HEIGHT) return false;

  const words = fileName(image.source).toLowerCase().split(/[^a-z0-9áéíóúñ]+/);
  return !words.some((word) => NON_PHOTO_WORDS.has(word));
}

/** Devuelve la URL de la imagen a 960 px de ancho como máximo: los originales de Commons pueden pesar varios MB. */
function scaled(image: z.infer<typeof imageSchema>): string {
  const url = image.source.split('?')[0] ?? image.source;
  if (image.width <= TARGET_WIDTH) return url;

  const original = ORIGINAL_URL.exec(url);
  if (original) {
    const [, base, first, second, file] = original;
    return `${base}/thumb/${first}/${second}/${file}/${TARGET_WIDTH}px-${file}`;
  }

  const thumbnailWidth = THUMBNAIL_WIDTH.exec(url)?.[1];
  if (thumbnailWidth && Number(thumbnailWidth) > TARGET_WIDTH) {
    return url.replace(THUMBNAIL_WIDTH, (match) => match.replace(/\/\d+px-/, `/${TARGET_WIDTH}px-`));
  }
  return url;
}

/**
 * Primera fotografía válida de las páginas de un evento; prefiere las apaisadas, que encajan mejor en el hero.
 * `exclude` evita repetir la imagen genérica de una página (un terremoto, un planeta) en varias efemérides.
 */
export function pickPhoto(pages: readonly WikipediaPage[], exclude: ReadonlySet<string> = new Set()): Photo | null {
  const photos: Photo[] = [];
  for (const page of pages) {
    if (page.type === 'disambiguation') continue;
    const image = page.originalimage ?? page.thumbnail;
    if (image && isPhoto(image)) {
      photos.push({
        url: scaled(image),
        width: image.width,
        height: image.height,
        pageUrl: page.content_urls?.desktop.page,
      });
    }
  }
  const candidates = photos.filter((photo) => !exclude.has(photo.url));
  return candidates.find((photo) => photo.width >= photo.height) ?? candidates[0] ?? null;
}
