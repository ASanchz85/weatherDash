/** Modelo interno de la calidad del aire; los valores ausentes se representan con null. */
export interface AirQualitySnapshot {
  /** Índice europeo de calidad del aire (0-20 bueno … más de 100 extremadamente malo). */
  europeanAqi: number | null;
  /** Partículas PM2.5 en µg/m³. */
  pm25: number | null;
  /** Polvo (p. ej. sahariano) en µg/m³. */
  dust: number | null;
  uvIndex: number | null;
  /** Granos de polen por m³; null si el proveedor no cubre la zona, 0 fuera de temporada. */
  pollen: {
    olive: number | null;
    grass: number | null;
  };
}

/** Respuesta pública de GET /api/air-quality. */
export interface AirQualityReport extends AirQualitySnapshot {
  /** Momento en que se obtuvieron los datos del proveedor (ISO 8601, UTC). */
  updatedAt: string;
  /** true si el proveedor falló y se devuelve la última información válida. */
  stale: boolean;
}
