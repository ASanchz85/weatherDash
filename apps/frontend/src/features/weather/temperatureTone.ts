import type { CSSProperties } from 'react';

/** Tramos de color de la temperatura; `neutral` es el blanco por defecto. */
export type TemperatureTone = 'hot' | 'warm' | 'mild' | 'cool' | 'cold' | 'freezing' | 'neutral';

/**
 * Tramo de una temperatura. Se evalúa sobre el valor redondeado, que es el que se muestra,
 * para que el color nunca contradiga al número («36°» no se pinta como «mayor de 36»).
 */
export function temperatureTone(value: number | null): TemperatureTone {
  if (value === null) return 'neutral';
  const shown = Math.round(value);

  if (shown > 36) return 'hot';
  if (shown > 29) return 'warm';
  if (shown > 22) return 'mild';
  if (shown < 0) return 'freezing';
  if (shown < 7) return 'cold';
  if (shown < 12) return 'cool';
  return 'neutral';
}

/** Estilo en línea para que el color gane a cualquier color heredado del contenedor. */
export function temperatureStyle(value: number | null): CSSProperties | undefined {
  const tone = temperatureTone(value);
  return tone === 'neutral' ? undefined : { color: `var(--temp-${tone})` };
}
