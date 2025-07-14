export interface DatabaseLocation {
    /** Full path to the database file */
    path: string;
    /** Location type */
    type: 'development' | 'windows' | 'macos' | 'custom';
    /** Human-readable description */
    description: string;
    /** Whether the file exists */
    exists: boolean;
    /** File size if it exists */
    size?: number;
    /** Last modified date if it exists */
    lastModified?: Date;
}
export interface CatalogLocation {
    /** Full path to the catalog database file */
    path: string;
    /** Whether the file exists */
    exists: boolean;
    /** File size if it exists */
    size?: number;
    /** Last modified date if it exists */
    lastModified?: Date;
}
export declare class DatabaseLocator {
    private static readonly DATABASE_FILENAME;
    private static readonly SUBDIRECTORY;
    private static readonly CATALOG_FILENAME;
    private static readonly CATALOG_SUBDIRECTORY;
    /**
     * Find all possible Logos NotesTool database locations
     */
    static findDatabases(): DatabaseLocation[];
    /**
     * Get the best database location (first existing one)
     */
    static getBestDatabase(): DatabaseLocation | null;
    /**
     * Find database in custom path
     */
    static checkCustomPath(customPath: string): DatabaseLocation | null;
    /**
     * Find Windows Logos installations
     */
    private static findWindowsLocations;
    /**
     * Find macOS Logos installations
     */
    private static findMacOSLocations;
    /**
     * Search for random ID directories containing the database
     */
    private static searchRandomIdDirectories;
    /**
     * Create a database location object with metadata
     */
    private static createLocation;
    /**
     * Validate that a database file is readable and appears to be a valid SQLite database
     */
    static validateDatabase(path: string): {
        valid: boolean;
        error?: string;
        info?: string;
    };
    /**
     * Display all found database locations for debugging
     */
    static displayLocations(): string[];
    /**
     * Get platform-specific search instructions for manual database location
     */
    static getSearchInstructions(): string[];
    /**
     * Get the catalog database location based on the notestool database path
     */
    static getCatalogLocation(notestoolPath: string): CatalogLocation | null;
}
