import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { IN_MEMORY_DATABASE, openDatabase, type SqliteDatabase } from './database.js';
import { createSqliteSnapshotStorage } from './sqlite-snapshot-storage.js';

const databases: SqliteDatabase[] = [];
const tempDirs: string[] = [];

function open(path = IN_MEMORY_DATABASE): SqliteDatabase {
  const db = openDatabase(path);
  databases.push(db);
  return db;
}

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'weatherdash-db-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  databases.splice(0).forEach((db) => db.open && db.close());
  tempDirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

describe('openDatabase', () => {
  it('aplica las migraciones y es idempotente al reabrir', () => {
    const path = join(createTempDir(), 'anidado', 'weatherdash.db');

    open(path).close();
    const reopened = open(path);

    expect(reopened.pragma('user_version', { simple: true })).toBe(1);
    expect(reopened.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").pluck().all()).toContain(
      'snapshots',
    );
  });
});

describe('createSqliteSnapshotStorage', () => {
  it('devuelve null si el recurso nunca se guardó', () => {
    const store = createSqliteSnapshotStorage(open()).storeFor('weather');

    expect(store.load()).toBeNull();
  });

  it('reemplaza el dato anterior en lugar de acumular un histórico', () => {
    const db = open();
    const store = createSqliteSnapshotStorage(db).storeFor<{ temperature: number }>('weather');

    store.save({ value: { temperature: 10 }, fetchedAt: 1000 });
    store.save({ value: { temperature: 12 }, fetchedAt: 2000 });

    expect(store.load()).toEqual({ value: { temperature: 12 }, fetchedAt: 2000 });
    expect(db.prepare('SELECT COUNT(*) FROM snapshots').pluck().get()).toBe(1);
  });

  it('mantiene separados los distintos recursos', () => {
    const storage = createSqliteSnapshotStorage(open());

    storage.storeFor('weather').save({ value: 'tiempo', fetchedAt: 1 });
    storage.storeFor('air-quality').save({ value: 'aire', fetchedAt: 2 });

    expect(storage.storeFor('weather').load()).toEqual({ value: 'tiempo', fetchedAt: 1 });
    expect(storage.storeFor('air-quality').load()).toEqual({ value: 'aire', fetchedAt: 2 });
  });

  it('conserva el dato al cerrar y reabrir la base de datos', () => {
    const path = join(createTempDir(), 'weatherdash.db');
    const first = open(path);
    createSqliteSnapshotStorage(first).storeFor('weather').save({ value: { ok: true }, fetchedAt: 42 });
    first.close();

    const store = createSqliteSnapshotStorage(open(path)).storeFor('weather');

    expect(store.load()).toEqual({ value: { ok: true }, fetchedAt: 42 });
  });
});
