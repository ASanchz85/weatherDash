import type { SqliteDatabase } from '../../database/database.js';
import type { NewsFeed, NewsItem, ParsedNewsItem } from './news.types.js';

interface NewsRow {
  id: number;
  feed: NewsFeed;
  title: string;
  link: string;
  description: string;
  enclosure_url: string;
  guid: string;
  pub_date: number;
  category: string;
}

export interface NewsRepository {
  /** Guarda las noticias nuevas; las ya existentes (misma URL) se ignoran. Devuelve cuántas se insertaron. */
  saveItems(feed: NewsFeed, items: readonly ParsedNewsItem[]): number;
  /** Elimina las noticias publicadas antes del instante indicado, de todos los feeds o solo del indicado. */
  deleteOlderThan(cutoffMs: number, feed?: NewsFeed): number;
  /** Indica si el feed tiene alguna noticia publicada desde el instante indicado. */
  hasItemsSince(feed: NewsFeed, sinceMs: number): boolean;
  /**
   * Elige hasta `limit` noticias del feed, las más recientes sin mostrar, y las marca como mostradas.
   * Si no hay suficientes sin mostrar, reinicia el estado del feed y completa con las más recientes.
   * Con `sinceMs` solo se consideran las publicadas desde ese instante.
   */
  takeNextBatch(feed: NewsFeed, limit: number, sinceMs?: number): NewsItem[];
}

function toItem(row: NewsRow): NewsItem {
  return {
    id: row.id,
    feed: row.feed,
    title: row.title,
    link: row.link,
    description: row.description,
    enclosureUrl: row.enclosure_url,
    guid: row.guid,
    publishedAt: row.pub_date,
    category: row.category,
  };
}

export function createNewsRepository(db: SqliteDatabase): NewsRepository {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO news (feed, title, link, description, enclosure_url, guid, pub_date, category)
     VALUES (@feed, @title, @link, @description, @enclosureUrl, @guid, @publishedAt, @category)`,
  );
  const deleteOlder = db.prepare('DELETE FROM news WHERE pub_date < ?');
  const deleteOlderInFeed = db.prepare('DELETE FROM news WHERE pub_date < ? AND feed = ?');
  const countSince = db.prepare('SELECT COUNT(*) FROM news WHERE feed = ? AND pub_date >= ?').pluck();
  const selectUnshown = db.prepare(
    `SELECT * FROM news WHERE feed = ? AND pub_date >= ? AND has_been_shown = 0 ORDER BY pub_date DESC, id DESC LIMIT ?`,
  );
  const selectNewest = db.prepare(
    `SELECT * FROM news WHERE feed = ? AND pub_date >= ? ORDER BY pub_date DESC, id DESC`,
  );
  const resetShown = db.prepare('UPDATE news SET has_been_shown = 0 WHERE feed = ?');
  const markShown = db.prepare('UPDATE news SET has_been_shown = 1 WHERE id = ?');

  const saveMany = db.transaction((feed: NewsFeed, items: readonly ParsedNewsItem[]) =>
    items.reduce((inserted, item) => inserted + insert.run({ feed, ...item }).changes, 0),
  );

  const takeBatch = db.transaction((feed: NewsFeed, limit: number, sinceMs: number) => {
    let selected = selectUnshown.all(feed, sinceMs, limit) as NewsRow[];

    if (selected.length < limit) {
      resetShown.run(feed);
      const taken = new Set(selected.map((row) => row.id));
      const fill = (selectNewest.all(feed, sinceMs) as NewsRow[])
        .filter((row) => !taken.has(row.id))
        .slice(0, limit - selected.length);
      selected = [...selected, ...fill].sort((a, b) => b.pub_date - a.pub_date || b.id - a.id);
    }

    selected.forEach((row) => markShown.run(row.id));
    return selected.map(toItem);
  });

  return {
    saveItems: (feed, items) => saveMany(feed, items),
    deleteOlderThan: (cutoffMs, feed) =>
      (feed === undefined ? deleteOlder.run(cutoffMs) : deleteOlderInFeed.run(cutoffMs, feed)).changes,
    hasItemsSince: (feed, sinceMs) => (countSince.get(feed, sinceMs) as number) > 0,
    takeNextBatch: (feed, limit, sinceMs = Number.MIN_SAFE_INTEGER) => takeBatch(feed, limit, sinceMs),
  };
}
