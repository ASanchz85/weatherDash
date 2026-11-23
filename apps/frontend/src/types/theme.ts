export type Theme = 'day' | 'night';

export function themeFromIsDay(isDay: boolean): Theme {
  return isDay ? 'day' : 'night';
}
