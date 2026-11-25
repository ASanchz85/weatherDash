import { afterEach, describe, expect, it, vi } from 'vitest';

import { IN_MEMORY_DATABASE, openDatabase, type SqliteDatabase } from '../../database/database.js';
import { buildNewsItem } from '../../test/fixtures.js';
import type { NewsProvider } from './news.provider.js';
import { createNewsRepository } from './news.repository.js';
import { createNewsService } from './news.service.js';
import type { NewsFeed } from './news.types.js';

const NOW = Date.UTC(2026, 10, 24, 10);
const feedUrls: Record<NewsFeed, string> = {
  national: 'https://example.com/nacional',
  international: 'https://example.com/internacional',
  economy: 'https://example.com/economia',
  markets: 'https://example.com/mercados',
};

const databases: SqliteDatabase[] = [];

function setup(fetchFeed: NewsProvider['fetchFeed'], logger = { warn: vi.fn() }, rotationSize = 8) {
  const db = openDatabase(IN_MEMORY_DATABASE);
  databases.push(db);
  const repository = createNewsRepository(db);
  const provider: NewsProvider = { fetchFeed };
  const service = createNewsService({
    providers: { national: provider, international: provider, economy: provider, markets: provider },
    repository,
    feedUrls,
    rotationSize,
    timeZone: 'Europe/Madrid',
    logger,
    now: () => NOW,
  });
  return { db, repository, service, logger };
}

afterEach(() => {
  databases.splice(0).forEach((db) => db.close());
});

describe('createNewsService', () => {
  it('guarda en cada feed las noticias de su URL', async () => {
    const fetchFeed = vi.fn(async (url: string) => [buildNewsItem(url.split('/').pop() ?? '')]);
    const { db, service } = setup(fetchFeed);

    await service.refresh();

    expect(db.prepare('SELECT feed, title FROM news ORDER BY feed').all()).toEqual([
      { feed: 'economy', title: 'Titular economia' },
      { feed: 'international', title: 'Titular internacional' },
      { feed: 'markets', title: 'Titular mercados' },
      { feed: 'national', title: 'Titular nacional' },
    ]);
  });

  it('conserva solo las noticias de hoy y ayer y elimina las de hace más de dos días', async () => {
    const { db, repository, service } = setup(async () => [
      buildNewsItem('hoy', { publishedAt: Date.UTC(2026, 10, 24, 8) }),
      buildNewsItem('ayer', { publishedAt: Date.UTC(2026, 10, 23, 12) }),
      buildNewsItem('antes', { publishedAt: Date.UTC(2026, 10, 22, 12) }),
    ]);
    repository.saveItems('national', [buildNewsItem('caducada', { publishedAt: Date.UTC(2026, 10, 21, 12) })]);

    await service.refresh();

    expect(db.prepare('SELECT DISTINCT title FROM news ORDER BY title').pluck().all()).toEqual([
      'Titular ayer',
      'Titular hoy',
    ]);
  });

  it('un feed que falla no impide actualizar los demás y queda registrado', async () => {
    const fetchFeed = vi.fn(async (url: string) => {
      if (url === feedUrls.international) throw new Error('caído');
      return [buildNewsItem(url.split('/').pop() ?? '')];
    });
    const { db, service, logger } = setup(fetchFeed);

    await service.refresh();

    expect(db.prepare('SELECT feed FROM news ORDER BY feed').pluck().all()).toEqual([
      'economy',
      'markets',
      'national',
    ]);
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ feed: 'international' }), expect.any(String));
  });

  it('comparte la consulta en curso entre refrescos simultáneos', async () => {
    const fetchFeed = vi.fn(async () => []);
    const { service } = setup(fetchFeed);

    await Promise.all([service.refresh(), service.refresh()]);

    expect(fetchFeed).toHaveBeenCalledTimes(4);
  });

  it('consulta cada feed con su propio proveedor', async () => {
    const europaPress = { fetchFeed: vi.fn(async (_url: string) => [buildNewsItem('ep')]) };
    const expansion = { fetchFeed: vi.fn(async (_url: string) => [buildNewsItem('ex')]) };
    const db = openDatabase(IN_MEMORY_DATABASE);
    databases.push(db);
    const service = createNewsService({
      providers: { national: europaPress, international: europaPress, economy: expansion, markets: expansion },
      repository: createNewsRepository(db),
      feedUrls,
      rotationSize: 8,
      timeZone: 'Europe/Madrid',
      now: () => NOW,
    });

    await service.refresh();

    expect(europaPress.fetchFeed.mock.calls.map(([url]) => url)).toEqual([feedUrls.national, feedUrls.international]);
    expect(expansion.fetchFeed.mock.calls.map(([url]) => url)).toEqual([feedUrls.economy, feedUrls.markets]);
  });

  it('entrega la rotación con fechas ISO', async () => {
    const { service } = setup(async () => [buildNewsItem('a', { publishedAt: Date.UTC(2026, 10, 24, 7, 32, 49) })]);
    await service.refresh();

    const rotation = service.nextRotation('national');

    expect(rotation.feed).toBe('national');
    expect(rotation.size).toBe(8);
    expect(rotation.items).toEqual([
      expect.objectContaining({ title: 'Titular a', publishedAt: '2026-11-24T07:32:49.000Z', category: 'Internacional' }),
    ]);
  });

  it('limita cada rotación al tamaño configurado y avanza por las noticias sin mostrar', async () => {
    const items = Array.from({ length: 7 }, (_, index) =>
      buildNewsItem(`n${index}`, { publishedAt: Date.UTC(2026, 10, 24, 0, index) }),
    );
    const { service } = setup(async (url) => (url === feedUrls.national ? items : []), undefined, 3);
    await service.refresh();

    const titles = () => service.nextRotation('national').items.map((item) => item.title);

    expect(titles()).toEqual(['Titular n6', 'Titular n5', 'Titular n4']);
    expect(titles()).toEqual(['Titular n3', 'Titular n2', 'Titular n1']);
    // Solo queda n0 sin mostrar: se reinicia el feed y se completa con las m\u00e1s recientes.
    expect(titles()).toEqual(['Titular n6', 'Titular n5', 'Titular n0']);
  });
});
