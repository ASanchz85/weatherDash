import { afterEach, describe, expect, it } from 'vitest';

import { IN_MEMORY_DATABASE, openDatabase, type SqliteDatabase } from '../../database/database.js';
import { buildNewsItem } from '../../test/fixtures.js';
import { createNewsRepository } from './news.repository.js';

const databases: SqliteDatabase[] = [];

function createRepository() {
  const db = openDatabase(IN_MEMORY_DATABASE);
  databases.push(db);
  return { db, repository: createNewsRepository(db) };
}

/** Noticias con fecha creciente: la de índice mayor es la más reciente. */
function buildItems(count: number, start = 0) {
  return Array.from({ length: count }, (_, index) =>
    buildNewsItem(`n${start + index}`, { publishedAt: Date.UTC(2026, 10, 24, 0, start + index) }),
  );
}

afterEach(() => {
  databases.splice(0).forEach((db) => db.close());
});

describe('createNewsRepository', () => {
  it('filtra duplicados por URL aunque lleguen por otro feed', () => {
    const { db, repository } = createRepository();
    const item = buildNewsItem('a');

    expect(repository.saveItems('national', [item, item])).toBe(1);
    expect(repository.saveItems('international', [item])).toBe(0);

    expect(db.prepare('SELECT feed FROM news').pluck().all()).toEqual(['national']);
  });

  it('conserva el origen del feed independiente de la categoría de Europa Press', () => {
    const { db, repository } = createRepository();

    repository.saveItems('markets', [buildNewsItem('a', { category: 'Economía' })]);

    expect(db.prepare('SELECT feed, category FROM news').get()).toEqual({ feed: 'markets', category: 'Economía' });
  });

  it('elimina las noticias anteriores al instante indicado', () => {
    const { db, repository } = createRepository();
    repository.saveItems('national', [
      buildNewsItem('old', { publishedAt: 1000 }),
      buildNewsItem('new', { publishedAt: 5000 }),
    ]);

    expect(repository.deleteOlderThan(2000)).toBe(1);
    expect(db.prepare('SELECT title FROM news').pluck().all()).toEqual(['Titular new']);
  });

  it('entrega las más recientes sin mostrar y avanza en la siguiente petición', () => {
    const { repository } = createRepository();
    repository.saveItems('national', buildItems(12));

    const first = repository.takeNextBatch('national', 8).map((item) => item.title);
    const second = repository.takeNextBatch('national', 8).map((item) => item.title);

    expect(first).toEqual(['n11', 'n10', 'n9', 'n8', 'n7', 'n6', 'n5', 'n4'].map((id) => `Titular ${id}`));
    // Solo quedan 4 sin mostrar: se completan con las más recientes ya mostradas.
    expect(second).toEqual(['n11', 'n10', 'n9', 'n8', 'n3', 'n2', 'n1', 'n0'].map((id) => `Titular ${id}`));
  });

  it('reinicia el estado de mostrado cuando todas las noticias ya se han mostrado', () => {
    const { db, repository } = createRepository();
    repository.saveItems('national', buildItems(8));

    repository.takeNextBatch('national', 8);
    const again = repository.takeNextBatch('national', 8);

    expect(again).toHaveLength(8);
    expect(again[0]?.title).toBe('Titular n7');
    expect(db.prepare('SELECT COUNT(*) FROM news WHERE has_been_shown = 1').pluck().get()).toBe(8);
  });

  it('solo muestra lo que hay cuando el feed tiene menos noticias que el límite', () => {
    const { repository } = createRepository();
    repository.saveItems('national', buildItems(3));

    expect(repository.takeNextBatch('national', 8)).toHaveLength(3);
    expect(repository.takeNextBatch('national', 8)).toHaveLength(3);
  });

  it('mantiene independientes los feeds y devuelve vacío si no hay noticias', () => {
    const { repository } = createRepository();
    repository.saveItems('national', buildItems(2));

    expect(repository.takeNextBatch('markets', 8)).toEqual([]);
    expect(repository.takeNextBatch('national', 8)).toHaveLength(2);
  });
});
