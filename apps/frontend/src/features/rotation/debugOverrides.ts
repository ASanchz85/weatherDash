export interface DebugOverrides {
  /** Fija la página mostrada y desactiva la rotación (?page=N). */
  page: number | null;
}

/** Parámetros de URL solo para depuración y capturas; los valores no válidos se ignoran. */
export function parseDebugOverrides(search: string): DebugOverrides {
  const params = new URLSearchParams(search);
  const rawPage = params.get('page');
  const page = rawPage !== null && /^\d+$/.test(rawPage) ? Number(rawPage) : null;
  return { page };
}
