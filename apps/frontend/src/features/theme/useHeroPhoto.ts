import { useEffect, useRef, useState } from 'react';

import type { Theme } from '../../types/theme';
import { HERO_PHOTOS, pickHeroPhoto, RECENT_PHOTOS_EXCLUDED } from './heroPhotos';

/**
 * Foto del hero: una aleatoria del tema que cambia con cada rotación (`rotationKey`) o cambio de tema,
 * sin repetir las dos últimas usadas, pero solo mientras `active` sea true para que no cambie con la vista oculta.
 */
export function useHeroPhoto(theme: Theme, rotationKey: number, active: boolean): string | null {
  const [photo, setPhoto] = useState(() => pickHeroPhoto(theme, []));
  const recent = useRef<string[]>(photo ? [photo] : []);
  const applied = useRef({ theme, rotationKey });

  useEffect(() => {
    // Se precargan todas para que el fundido no empiece con una foto aún sin descargar.
    for (const url of [...HERO_PHOTOS.day, ...HERO_PHOTOS.night]) new Image().src = url;
  }, []);

  useEffect(() => {
    if (!active) return;
    const changed = applied.current.theme !== theme || applied.current.rotationKey !== rotationKey;
    applied.current = { theme, rotationKey };
    if (!changed) return;

    const next = pickHeroPhoto(theme, recent.current);
    if (next) recent.current = [...recent.current, next].slice(-RECENT_PHOTOS_EXCLUDED);
    setPhoto(next);
  }, [theme, rotationKey, active]);

  return photo;
}
