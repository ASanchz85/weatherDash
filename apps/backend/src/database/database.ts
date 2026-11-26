import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database, { type Database as SqliteDatabase } from 'better-sqlite3';

export type { SqliteDatabase };

/** Ruta especial de SQLite para una base de datos en memoria (tests). */
export const IN_MEMORY_DATABASE = ':memory:';

/**
 * Migraciones en orden; la posición + 1 es la versión del esquema que deja aplicada.
 * Nunca se modifica una migración publicada: los cambios se añaden como una nueva al final.
 */
const MIGRATIONS: readonly string[] = [
  `CREATE TABLE snapshots (
     resource   TEXT    PRIMARY KEY,
     payload    TEXT    NOT NULL,
     fetched_at INTEGER NOT NULL
   ) STRICT`,
  `CREATE TABLE news (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     feed            TEXT    NOT NULL CHECK (feed IN ('national', 'international', 'markets')),
     title           TEXT    NOT NULL,
     link            TEXT    NOT NULL UNIQUE,
     description     TEXT    NOT NULL,
     enclosure_url   TEXT    NOT NULL,
     guid            TEXT    NOT NULL,
     pub_date        INTEGER NOT NULL,
     category        TEXT    NOT NULL,
     has_been_shown  INTEGER NOT NULL DEFAULT 0 CHECK (has_been_shown IN (0, 1))
   ) STRICT;
   CREATE INDEX news_feed_pub_date ON news (feed, pub_date DESC)`,
  // SQLite no permite modificar un CHECK: se recrea la tabla. Las noticias de markets venían de otro proveedor y se descartan.
  `CREATE TABLE news_v3 (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     feed            TEXT    NOT NULL CHECK (feed IN ('national', 'international', 'economy', 'markets')),
     title           TEXT    NOT NULL,
     link            TEXT    NOT NULL UNIQUE,
     description     TEXT    NOT NULL,
     enclosure_url   TEXT    NOT NULL,
     guid            TEXT    NOT NULL,
     pub_date        INTEGER NOT NULL,
     category        TEXT    NOT NULL,
     has_been_shown  INTEGER NOT NULL DEFAULT 0 CHECK (has_been_shown IN (0, 1))
   ) STRICT;
   INSERT INTO news_v3 (id, feed, title, link, description, enclosure_url, guid, pub_date, category, has_been_shown)
     SELECT id, feed, title, link, description, enclosure_url, guid, pub_date, category, has_been_shown
     FROM news WHERE feed <> 'markets';
   DROP TABLE news;
   ALTER TABLE news_v3 RENAME TO news;
   CREATE INDEX news_feed_pub_date ON news (feed, pub_date DESC)`,
  // Se recrea de nuevo la tabla para admitir el feed de efemérides.
  `CREATE TABLE news_v4 (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     feed            TEXT    NOT NULL CHECK (feed IN ('national', 'international', 'economy', 'markets', 'commemorations')),
     title           TEXT    NOT NULL,
     link            TEXT    NOT NULL UNIQUE,
     description     TEXT    NOT NULL,
     enclosure_url   TEXT    NOT NULL,
     guid            TEXT    NOT NULL,
     pub_date        INTEGER NOT NULL,
     category        TEXT    NOT NULL,
     has_been_shown  INTEGER NOT NULL DEFAULT 0 CHECK (has_been_shown IN (0, 1))
   ) STRICT;
   INSERT INTO news_v4 (id, feed, title, link, description, enclosure_url, guid, pub_date, category, has_been_shown)
     SELECT id, feed, title, link, description, enclosure_url, guid, pub_date, category, has_been_shown FROM news;
   DROP TABLE news;
   ALTER TABLE news_v4 RENAME TO news;
   CREATE INDEX news_feed_pub_date ON news (feed, pub_date DESC)`,
];

/** Abre (o crea) la base de datos y aplica las migraciones pendientes. */
export function openDatabase(path: string): SqliteDatabase {
  if (path !== IN_MEMORY_DATABASE) mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  // WAL tolera mejor los cortes de corriente y no bloquea lecturas durante una escritura.
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  migrate(db);
  return db;
}

function migrate(db: SqliteDatabase): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  MIGRATIONS.slice(currentVersion).forEach((sql, index) => {
    const version = currentVersion + index + 1;
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${version}`);
    })();
  });
}
