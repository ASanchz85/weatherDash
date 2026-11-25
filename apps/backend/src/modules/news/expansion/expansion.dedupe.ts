const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|ref$)/i;

/** Forma canónica de un enlace para compararlo: sin fragmento, sin parámetros de seguimiento ni barra final. */
export function normalizeLink(link: string): string {
  const url = new URL(link);
  url.hash = '';
  [...url.searchParams.keys()].filter((key) => TRACKING_PARAMS.test(key)).forEach((key) => url.searchParams.delete(key));
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.href;
}

/** Descarta las noticias cuyo enlace ya apareció antes en el mismo feed; se conserva la primera. */
export function dropDuplicateLinks<T extends { link: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeLink(item.link);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
