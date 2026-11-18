import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDb(file: string): DatabaseSync {
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  return db;
}

/**
 * Document-style table: one JSON blob per row. Keeps phase 1 flexible while the model settles;
 * individual collections can graduate to real columns later without touching callers.
 */
export class Collection<T extends { id: string }> {
  constructor(private db: DatabaseSync, private table: string) {
    db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`);
  }

  list(): T[] {
    return this.db.prepare(`SELECT data FROM ${this.table} ORDER BY rowid`).all()
      .map((r) => JSON.parse(String(r.data)) as T);
  }

  get(id: string): T | undefined {
    const row = this.db.prepare(`SELECT data FROM ${this.table} WHERE id = ?`).get(id);
    return row ? (JSON.parse(String(row.data)) as T) : undefined;
  }

  put(doc: T): T {
    this.db
      .prepare(`INSERT INTO ${this.table} (id, data, updated_at) VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
      .run(doc.id, JSON.stringify(doc), new Date().toISOString());
    return doc;
  }

  delete(id: string): boolean {
    return Number(this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`).run(id).changes) > 0;
  }

  count(): number {
    return Number(this.db.prepare(`SELECT COUNT(*) AS n FROM ${this.table}`).get()!.n);
  }
}
