/** Contrato de GET /api/air-quality. Debe mantenerse alineado con AirQualityReport del backend. */

export interface AirQualityData {
  /** Índice europeo de calidad del aire (0-20 bueno … más de 100 extremadamente malo). */
  europeanAqi: number | null;
  /** Partículas PM2.5 en µg/m³. */
  pm25: number | null;
  /** Polvo (p. ej. sahariano) en µg/m³. */
  dust: number | null;
  uvIndex: number | null;
  /** Granos de polen por m³; null si no hay cobertura, 0 fuera de temporada. */
  pollen: {
    olive: number | null;
    grass: number | null;
  };
  updatedAt: string;
  stale: boolean;
}
