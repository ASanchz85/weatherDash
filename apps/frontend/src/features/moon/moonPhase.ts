const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_CENTURY = 36525;
/** Época J2000.0: 1 de enero de 2000, 12:00. */
const J2000_MS = Date.UTC(2000, 0, 1, 12);
const DEGREES_TO_RADIANS = Math.PI / 180;
/** Margen angular (≈ 1 día de movimiento relativo de la Luna) en el que se usa el nombre propio de cada fase principal. */
const PRINCIPAL_WINDOW_DEGREES = 12;
const PRINCIPAL_PHASES = ['new', 'first-quarter', 'full', 'last-quarter'] as const;

export type MoonPhaseName =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface MoonPhase {
  name: MoonPhaseName;
  /** Fracción del disco iluminada, de 0 a 1. */
  illumination: number;
  /** Creciente (zona iluminada aumentando) o menguante. */
  waxing: boolean;
}

export const MOON_PHASE_LABELS: Readonly<Record<MoonPhaseName, string>> = {
  new: 'Luna nueva',
  'waxing-crescent': 'Luna creciente',
  'first-quarter': 'Cuarto creciente',
  'waxing-gibbous': 'Luna gibosa creciente',
  full: 'Luna llena',
  'waning-gibbous': 'Luna gibosa menguante',
  'last-quarter': 'Cuarto menguante',
  'waning-crescent': 'Luna menguante',
};

function sinDegrees(degrees: number): number {
  return Math.sin(degrees * DEGREES_TO_RADIANS);
}

/**
 * Elongación de la Luna respecto al Sol (0° nueva, 90° cuarto creciente, 180° llena, 270° cuarto menguante).
 * Elongación media más los términos periódicos principales (Meeus, «Astronomical Algorithms», cap. 48);
 * el error es de décimas de grado, de sobra para dibujar la fase.
 */
function moonElongationDegrees(date: Date): number {
  const centuries = (date.getTime() - J2000_MS) / (DAYS_PER_CENTURY * MS_PER_DAY);
  const meanElongation = 297.8501921 + 445267.1114034 * centuries;
  const sunAnomaly = 357.5291092 + 35999.0502909 * centuries;
  const moonAnomaly = 134.9633964 + 477198.8675055 * centuries;

  const elongation =
    meanElongation +
    6.289 * sinDegrees(moonAnomaly) -
    2.1 * sinDegrees(sunAnomaly) +
    1.274 * sinDegrees(2 * meanElongation - moonAnomaly) +
    0.658 * sinDegrees(2 * meanElongation) +
    0.214 * sinDegrees(2 * moonAnomaly) +
    0.11 * sinDegrees(meanElongation);
  return ((elongation % 360) + 360) % 360;
}

export function getMoonPhase(date: Date): MoonPhase {
  const elongation = moonElongationDegrees(date);
  const illumination = (1 - Math.cos(elongation * DEGREES_TO_RADIANS)) / 2;
  const waxing = elongation < 180;

  const principal = PRINCIPAL_PHASES.find((_, index) => {
    const distance = Math.abs(elongation - index * 90);
    return Math.min(distance, 360 - distance) <= PRINCIPAL_WINDOW_DEGREES;
  });
  if (principal) return { name: principal, illumination, waxing };

  const crescent = illumination < 0.5;
  const name: MoonPhaseName = waxing
    ? crescent
      ? 'waxing-crescent'
      : 'waxing-gibbous'
    : crescent
      ? 'waning-crescent'
      : 'waning-gibbous';
  return { name, illumination, waxing };
}

/** Frase corta para la interfaz, por ejemplo «Luna gibosa menguante · 97 %». */
export function describeMoonPhase({ name, illumination }: MoonPhase): string {
  return `${MOON_PHASE_LABELS[name]} · ${Math.round(illumination * 100)} %`;
}
