import type { Theme } from '../../types/theme';

export interface DebugOverrides {
  /** Fija la página mostrada y desactiva la rotación (?page=N). */
  page: number | null;
  /** Fuerza el tema sin esperar a los datos ni a la rotación (?theme=day|night). */
  theme: Theme | null;
}

/** Parámetros de URL solo para depuración y capturas; los valores no válidos se ignoran. */
export function parseDebugOverrides(search: string): DebugOverrides {
  const params = new URLSearchParams(search);
  const rawPage = params.get('page');
  const rawTheme = params.get('theme');
  return {
    page: rawPage !== null && /^\d+$/.test(rawPage) ? Number(rawPage) : null,
    theme: rawTheme === 'day' || rawTheme === 'night' ? rawTheme : null,
  };
}
