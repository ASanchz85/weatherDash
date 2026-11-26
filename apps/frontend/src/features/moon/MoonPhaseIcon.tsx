const RADIUS = 50;
const SIZE = RADIUS * 2;
const NEW_MOON_LIMIT = 0.01;
const FULL_MOON_LIMIT = 0.99;

/**
 * Trazado de la zona iluminada en un disco de 100×100 con la parte iluminada a la derecha:
 * el limbo es una semicircunferencia y el terminador, una semielipse cuyo radio horizontal es |1 − 2·iluminación|.
 * Devuelve null si la luna está apagada y un círculo completo si está llena.
 */
export function moonLitPath(illumination: number): string | null {
  if (illumination <= NEW_MOON_LIMIT) return null;
  if (illumination >= FULL_MOON_LIMIT) {
    return `M ${RADIUS} 0 A ${RADIUS} ${RADIUS} 0 1 1 ${RADIUS} ${SIZE} A ${RADIUS} ${RADIUS} 0 1 1 ${RADIUS} 0 Z`;
  }

  const terminatorRadius = (RADIUS * Math.abs(1 - 2 * illumination)).toFixed(2);
  // El terminador abomba hacia la zona iluminada en cuarto creciente o menguante (< 50 %) y hacia la oscura en gibosa.
  const bulgesToLitSide = illumination < 0.5 ? 0 : 1;
  return `M ${RADIUS} 0 A ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} ${SIZE} A ${terminatorRadius} ${RADIUS} 0 0 ${bulgesToLitSide} ${RADIUS} 0 Z`;
}

interface MoonPhaseIconProps {
  illumination: number;
  waxing: boolean;
}

/** Disco lunar dibujado con el color del texto; en el hemisferio norte la luna creciente se ilumina por la derecha. */
export function MoonPhaseIcon({ illumination, waxing }: MoonPhaseIconProps) {
  const lit = moonLitPath(illumination);

  return (
    <svg viewBox={`-3 -3 ${SIZE + 6} ${SIZE + 6}`} width="1em" height="1em" aria-hidden="true" focusable="false">
      <circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="currentColor" fillOpacity="0.22" />
      {lit && <path d={lit} fill="currentColor" transform={waxing ? undefined : `translate(${SIZE} 0) scale(-1 1)`} />}
      <circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="3" />
    </svg>
  );
}
