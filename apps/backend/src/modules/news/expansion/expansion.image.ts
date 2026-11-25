import { z } from 'zod';

const httpUrl = z.url({ protocol: /^https?$/ });

const mediaContentSchema = z.object({
  '@_url': httpUrl,
  '@_medium': z.string().optional(),
});

/**
 * URL de la imagen principal (`media:content`). Expansión ya la sirve en el tamaño adecuado, así que no se transforma.
 * Devuelve `null` cuando no hay imagen utilizable.
 */
export function extractImageUrl(mediaContent: unknown): string | null {
  const candidates = Array.isArray(mediaContent) ? mediaContent : [mediaContent];

  for (const candidate of candidates) {
    const media = mediaContentSchema.safeParse(candidate);
    if (media.success && (media.data['@_medium'] ?? 'image') === 'image') return media.data['@_url'];
  }
  return null;
}
