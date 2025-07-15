/**
 * Database adapter for Electron environment
 * This wraps better-sqlite3 to provide the same interface as bun:sqlite
 */

import BetterSqlite3 from 'better-sqlite3';

export class Database {
  private db: BetterSqlite3.Database;

  constructor(path: string, options?: { readonly?: boolean }) {
    this.db = new BetterSqlite3(path, options);
  }

  query(sql: string) {
    const stmt = this.db.prepare(sql);
    return {
      all: (...params: any[]) => stmt.all(...params),
      get: (...params: any[]) => stmt.get(...params),
    };
  }

  prepare(sql: string) {
    return this.db.prepare(sql);
  }

  run(sql: string, ...params: any[]) {
    return this.db.prepare(sql).run(...params);
  }

  close() {
    this.db.close();
  }
}

// Export as default and named export to match bun:sqlite structure
export default Database; 