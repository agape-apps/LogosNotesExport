/**
 * Database adapter for Electron environment
 * This wraps better-sqlite3 to provide the same interface as bun:sqlite
 */

import BetterSqlite3 from 'better-sqlite3';

export class Database {
  private db: BetterSqlite3.Database;

  constructor(path: string, options?: { readonly?: boolean }) {
    // Validate that path is provided and is a string
    if (!path || typeof path !== 'string') {
      throw new Error(`Database path is required and must be a string. Received: ${typeof path} (${path})`);
    }

    // Validate that path is not empty
    if (path.trim() === '') {
      throw new Error('Database path cannot be empty');
    }

    console.log('Creating database connection to:', path);
    
    try {
      this.db = new BetterSqlite3(path, options);
    } catch (error) {
      console.error('Failed to create database connection:', error);
      throw new Error(`Failed to open database at "${path}": ${error.message}`);
    }
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