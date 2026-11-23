export interface ResolvedLocation {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

/** Resultado del geocoding del proveedor, antes de combinarlo con la configuración. */
export interface GeocodedPlace {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}
