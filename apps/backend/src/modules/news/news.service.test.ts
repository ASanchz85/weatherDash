import { afterEach, describe, expect, it, vi } from 'vitest';

import { IN_MEMORY_DATABASE, openDatabase, type SqliteDatabase } from '../../database/database.js';
import { buildNewsItem } from '../../test/fixtures.js';
import { createNewsRepository } from './news.repository.js';
import { createNewsService } from './news.service.js';
import type { NewsFeed, NewsProvider } from './news.types.js';

const NOW = Date.UTC(2026, 10, 24, 10);
const feedUrls: Record<NewsFeed, string> = {
  national: 'https://example.com/nacional',
  international: 'https://example.com/internacional',
  economy: 'https://example.com/economia',
  markets: 'https://example.com/mercados',
  commemorations: 'https://example.com/efemerides/{MM}/{DD}',
};

const databases: SqliteDatabase[] = [];

/** Primer segmento de la ruta de la URL de un feed. */
function slugOf(url: string): string {
  return new URL(url).pathname.split('/')[1] ?? '';
}

function setup(fetchFeed: NewsProvider['fetchFeed'], logger = { warn: vi.fn() }, rotationSize = 8) {
  const db = openDatabase(IN_MEMORY_DATABASE);
  databases.push(db);
  const repository = createNewsRepository(db);
  const provider: NewsProvider = { fetchFeed };
  const service = createNewsService({
    providers: {
      national: provider,
      international: provider,
      economy: provider,
      markets: provider,
      commemorations: provider,
    },
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
    const fetchFeed = vi.fn(async (url: string) => [buildNewsItem(slugOf(url))]);
    const { db, service } = setup(fetchFeed);

    await service.refresh();

    expect(db.prepare('SELECT feed, title FROM news ORDER BY feed').all()).toEqual([
      { feed: 'commemorations', title: 'Titular efemerides' },
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
      return [buildNewsItem(slugOf(url))];
    });
    const { db, service, logger } = setup(fetchFeed);

    await service.refresh();

    expect(db.prepare('SELECT feed FROM news ORDER BY feed').pluck().all()).toEqual([
      'commemorations',
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

    expect(fetchFeed).toHaveBeenCalledTimes(5);
  });

  it('consulta cada feed con su propio proveedor', async () => {
    const europaPress = { fetchFeed: vi.fn(async (_url: string) => [buildNewsItem('ep')]) };
    const expansion = { fetchFeed: vi.fn(async (_url: string) => [buildNewsItem('ex')]) };
    const wikipedia = { fetchFeed: vi.fn(async (_url: string) => [buildNewsItem('wp')]) };
    const db = openDatabase(IN_MEMORY_DATABASE);
    databases.push(db);
    const service = createNewsService({
      providers: {
        national: europaPress,
        international: europaPress,
        economy: expansion,
        markets: expansion,
        commemorations: wikipedia,
      },
      repository: createNewsRepository(db),
      feedUrls,
      rotationSize: 8,
      timeZone: 'Europe/Madrid',
      now: () => NOW,
    });

    await service.refresh();

    expect(europaPress.fetchFeed.mock.calls.map(([url]) => url)).toEqual([feedUrls.national, feedUrls.international]);
    expect(expansion.fetchFeed.mock.calls.map(([url]) => url)).toEqual([feedUrls.economy, feedUrls.markets]);
    expect(wikipedia.fetchFeed.mock.calls.map(([url]) => url)).toEqual([feedUrls.commemorations]);
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

  describe('feed de efemérides', () => {
    const TODAY = Date.UTC(2026, 10, 23, 23);
    const YESTERDAY = Date.UTC(2026, 10, 22, 23);

    it('refreshDaily solo consulta los feeds diarios y confirma que hay contenido de hoy', async () => {
      const fetchFeed = vi.fn(async (_url: string) => [buildNewsItem('wp', { publishedAt: TODAY })]);
      const { service } = setup(fetchFeed);

      await expect(service.refreshDaily()).resolves.toBe(true);

      expect(fetchFeed.mock.calls.map(([url]) => url)).toEqual([feedUrls.commemorations]);
    });

    it('refreshDaily sustituye las efemérides de ayer por las de hoy', async () => {
      const { db, repository, service } = setup(async () => [buildNewsItem('hoy', { publishedAt: TODAY })]);
      repository.saveItems('commemorations', [buildNewsItem('ayer', { publishedAt: YESTERDAY })]);

      await service.refreshDaily();

      expect(db.prepare("SELECT title FROM news WHERE feed = 'commemorations'").pluck().all()).toEqual(['Titular hoy']);
    });

    it('refreshDaily devuelve false si la consulta falla o no trae efemérides', async () => {
      const failing = setup(async () => {
        throw new Error('caído');
      });
      const empty = setup(async () => []);

      await expect(failing.service.refreshDaily()).resolves.toBe(false);
      await expect(empty.service.refreshDaily()).resolves.toBe(false);
    });

    it('no consulta dos veces a la vez el mismo feed aunque coincidan el refresco periódico y el diario', async () => {
      const fetchFeed = vi.fn(async (_url: string) => []);
      const { service } = setup(fetchFeed);

      await Promise.all([service.refresh(), service.refreshDaily()]);

      expect(fetchFeed.mock.calls.filter(([url]) => url === feedUrls.commemorations)).toHaveLength(1);
    });

    it('solo conserva y entrega las efemérides de hoy', async () => {
      const { db, repository, service } = setup(async () => []);
      repository.saveItems('commemorations', [
        buildNewsItem('hoy', { publishedAt: TODAY }),
        buildNewsItem('ayer', { publishedAt: YESTERDAY }),
      ]);

      expect(service.nextRotation('commemorations').items.map((item) => item.title)).toEqual(['Titular hoy']);

      await service.refresh();

      expect(db.prepare("SELECT title FROM news WHERE feed = 'commemorations'").pluck().all()).toEqual(['Titular hoy']);
    });

    it('no vuelve a consultar el proveedor si ya hay efemérides de hoy', async () => {
      const fetchFeed = vi.fn(async (url: string) =>
        url === feedUrls.commemorations ? [buildNewsItem('wp', { publishedAt: TODAY })] : [],
      );
      const { service } = setup(fetchFeed);

      await service.refresh();
      await service.refresh();

      expect(fetchFeed.mock.calls.filter(([url]) => url === feedUrls.commemorations)).toHaveLength(1);
    });

    it('reintenta en el siguiente refresco si el proveedor falló', async () => {
      let failing = true;
      const fetchFeed = vi.fn(async (url: string) => {
        if (url !== feedUrls.commemorations) return [];
        if (failing) throw new Error('caído');
        return [buildNewsItem('wp', { publishedAt: TODAY })];
      });
      const { service } = setup(fetchFeed);

      await service.refresh();
      expect(service.nextRotation('commemorations').items).toEqual([]);

      failing = false;
      await service.refresh();
      expect(service.nextRotation('commemorations').items).toHaveLength(1);
    });
  });
});
