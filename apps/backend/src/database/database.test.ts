import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

import { IN_MEMORY_DATABASE, openDatabase } from './database.js';

const directories: string[] = [];

afterEach(() => {
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
});

const INSERT_NEWS = `INSERT INTO news (feed, title, link, description, enclosure_url, guid, pub_date, category)
   VALUES (?, 't', ?, 'd', 'https://img/x.jpg', 'g', 1, 'c')`;

describe('openDatabase', () => {
  it('admite el feed economy', () => {
    const db = openDatabase(IN_MEMORY_DATABASE);

    expect(() => db.prepare(INSERT_NEWS).run('economy', 'https://a')).not.toThrow();
    expect(() => db.prepare(INSERT_NEWS).run('deportes', 'https://b')).toThrow();
    db.close();
  });

  it('al migrar desde el esquema anterior conserva las noticias salvo las de markets', () => {
    const directory = mkdtempSync(join(tmpdir(), 'weatherdash-'));
    directories.push(directory);
    const path = join(directory, 'db.sqlite');

    // Esquema de la versión 2: la tabla news original, sin economy en el CHECK.
    const legacy = new Database(path);
    legacy.exec(`CREATE TABLE snapshots (
        resource TEXT PRIMARY KEY, payload TEXT NOT NULL, fetched_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feed TEXT NOT NULL CHECK (feed IN ('national', 'international', 'markets')),
        title TEXT NOT NULL, link TEXT NOT NULL UNIQUE, description TEXT NOT NULL,
        enclosure_url TEXT NOT NULL, guid TEXT NOT NULL, pub_date INTEGER NOT NULL, category TEXT NOT NULL,
        has_been_shown INTEGER NOT NULL DEFAULT 0 CHECK (has_been_shown IN (0, 1))
      ) STRICT;
      CREATE INDEX news_feed_pub_date ON news (feed, pub_date DESC);`);
    legacy.prepare(INSERT_NEWS).run('national', 'https://n');
    legacy.prepare(INSERT_NEWS).run('markets', 'https://m');
    legacy.pragma('user_version = 2');
    legacy.close();

    const db = openDatabase(path);

    expect(db.prepare('SELECT feed FROM news').pluck().all()).toEqual(['national']);
    expect(() => db.prepare(INSERT_NEWS).run('economy', 'https://e')).not.toThrow();
    expect(db.pragma('user_version', { simple: true })).toBe(3);
    db.close();
  });
});
