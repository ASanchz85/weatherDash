import type { Theme } from '../../types/theme';

// Con `eager` y `?url` el resultado es el mapa ruta → URL final del recurso, sin cargar las fotos al arrancar.
const DAY_PHOTOS = Object.values(
  import.meta.glob<string>('../../../assets/day/*.webp', { eager: true, query: '?url', import: 'default' }),
);
const NIGHT_PHOTOS = Object.values(
  import.meta.glob<string>('../../../assets/night/*.webp', { eager: true, query: '?url', import: 'default' }),
);

export const HERO_PHOTOS: Readonly<Record<Theme, readonly string[]>> = {
  day: DAY_PHOTOS,
  night: NIGHT_PHOTOS,
};

/** Cuántas fotos usadas en último lugar no se repiten. */
export const RECENT_PHOTOS_EXCLUDED = 2;

/**
 * Foto aleatoria del tema que no esté entre las usadas recientemente (de la más antigua a la más reciente).
 * Si el tema tiene pocas fotos, se relaja la regla hasta evitar al menos la última; null si no hay ninguna.
 */
export function pickHeroPhoto(
  theme: Theme,
  recent: readonly string[],
  random: () => number = Math.random,
  photos: Readonly<Record<Theme, readonly string[]>> = HERO_PHOTOS,
): string | null {
  const pool = photos[theme];
  const fresh = pool.filter((photo) => !recent.includes(photo));
  const candidates = fresh.length > 0 ? fresh : pool.length > 1 ? pool.filter((photo) => photo !== recent.at(-1)) : pool;
  return candidates[Math.floor(random() * candidates.length)] ?? null;
}
