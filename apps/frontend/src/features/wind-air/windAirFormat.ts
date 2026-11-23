import { LOCALE } from '../../config';
import type { AirQualityData } from '../../types/airQuality';

const PLACEHOLDER = '—';

const CARDINAL_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;
const DEGREES_PER_POINT = 360 / CARDINAL_POINTS.length;

const decimalFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** Punto cardinal (en español) de la dirección de la que viene el viento. */
export function formatWindDirection(degrees: number | null): string {
  if (degrees === null) return PLACEHOLDER;
  const normalized = ((degrees % 360) + 360) % 360;
  return CARDINAL_POINTS[Math.round(normalized / DEGREES_PER_POINT) % CARDINAL_POINTS.length] ?? PLACEHOLDER;
}

export function formatPressure(hectopascals: number | null): string {
  return hectopascals === null ? PLACEHOLDER : `${integerFormatter.format(hectopascals)} hPa`;
}

export function formatUvIndex(value: number | null): string {
  return value === null ? PLACEHOLDER : integerFormatter.format(value);
}

/** Concentración en µg/m³ con un decimal como máximo. */
export function formatMicrograms(value: number | null): string {
  return value === null ? PLACEHOLDER : `${decimalFormatter.format(value)} µg/m³`;
}

export type AirQualityTone = 'good' | 'fair' | 'moderate' | 'poor' | 'very-poor' | 'extreme';

export interface AirQualityLevel {
  label: string;
  tone: AirQualityTone;
}

/** Límites superiores del índice europeo de calidad del aire (EAQI) de cada nivel. */
const AIR_QUALITY_LEVELS: readonly (AirQualityLevel & { upTo: number })[] = [
  { upTo: 20, label: 'Buena', tone: 'good' },
  { upTo: 40, label: 'Razonable', tone: 'fair' },
  { upTo: 60, label: 'Moderada', tone: 'moderate' },
  { upTo: 80, label: 'Mala', tone: 'poor' },
  { upTo: 100, label: 'Muy mala', tone: 'very-poor' },
];

const EXTREME_LEVEL: AirQualityLevel = { label: 'Extremadamente mala', tone: 'extreme' };

export function airQualityLevel(europeanAqi: number | null): AirQualityLevel | null {
  if (europeanAqi === null) return null;
  const level = AIR_QUALITY_LEVELS.find(({ upTo }) => europeanAqi <= upTo);
  return level ? { label: level.label, tone: level.tone } : EXTREME_LEVEL;
}

const POLLEN_SPECIES = [
  { key: 'olive', label: 'Olivo' },
  { key: 'grass', label: 'Gramíneas' },
] as const;

/** «—» sin cobertura del proveedor, «Sin polen» fuera de temporada y la especie dominante si lo hay. */
export function formatPollen(pollen: AirQualityData['pollen']): string {
  const measured = POLLEN_SPECIES.flatMap(({ key, label }) => {
    const grains = pollen[key];
    return grains === null ? [] : [{ label, grains }];
  });
  if (measured.length === 0) return PLACEHOLDER;

  const dominant = measured.reduce((best, candidate) => (candidate.grains > best.grains ? candidate : best));
  if (dominant.grains <= 0) return 'Sin polen';
  return `${dominant.label} ${integerFormatter.format(dominant.grains)} gr/m³`;
}
