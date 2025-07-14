import { type CatalogLocation } from './database-locator.js';
export interface CatalogRecord {
    resourceId: string;
    title: string;
}
export declare class CatalogDatabase {
    private db;
    private catalogLocation;
    constructor(notestoolDbPath: string);
    /**
     * Find the catalog database location based on the notestool database path
     */
    private findCatalogDatabase;
    /**
     * Get information about the catalog database being used
     */
    getCatalogInfo(): CatalogLocation;
    /**
     * Get book title by resourceId
     */
    getTitleByResourceId(resourceId: string): string | null;
    /**
     * Get multiple titles by resourceIds
     */
    getTitlesByResourceIds(resourceIds: string[]): Map<string, string>;
    /**
     * Get all records (for debugging purposes)
     */
    getAllRecords(): CatalogRecord[];
    /**
     * Close database connection
     */
    close(): void;
}
