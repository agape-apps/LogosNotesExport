import { Database } from 'bun:sqlite';
import { DatabaseLocator } from './database-locator.js';
export class CatalogDatabase {
    constructor(notestoolDbPath) {
        const catalogLocation = this.findCatalogDatabase(notestoolDbPath);
        if (!catalogLocation || !catalogLocation.exists) {
            throw new Error(`Catalog database not found. Expected at: ${catalogLocation?.path || 'unknown'}`);
        }
        this.catalogLocation = catalogLocation;
        // Open database in READ-ONLY mode for safety
        this.db = new Database(this.catalogLocation.path, { readonly: true });
    }
    /**
     * Find the catalog database location based on the notestool database path
     */
    findCatalogDatabase(notestoolDbPath) {
        return DatabaseLocator.getCatalogLocation(notestoolDbPath);
    }
    /**
     * Get information about the catalog database being used
     */
    getCatalogInfo() {
        return { ...this.catalogLocation };
    }
    /**
     * Get book title by resourceId
     */
    getTitleByResourceId(resourceId) {
        const query = `
      SELECT Title as title
      FROM Records
      WHERE ResourceId = ?
      LIMIT 1
    `;
        const result = this.db.query(query).get(resourceId);
        return result?.title || null;
    }
    /**
     * Get multiple titles by resourceIds
     */
    getTitlesByResourceIds(resourceIds) {
        if (resourceIds.length === 0) {
            return new Map();
        }
        const placeholders = resourceIds.map(() => '?').join(',');
        const query = `
      SELECT ResourceId as resourceId, Title as title
      FROM Records
      WHERE ResourceId IN (${placeholders})
    `;
        const results = this.db.query(query).all(...resourceIds);
        const titleMap = new Map();
        for (const record of results) {
            titleMap.set(record.resourceId, record.title);
        }
        return titleMap;
    }
    /**
     * Get all records (for debugging purposes)
     */
    getAllRecords() {
        const query = `
      SELECT ResourceId as resourceId, Title as title
      FROM Records
      ORDER BY ResourceId
    `;
        return this.db.query(query).all();
    }
    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }
}
