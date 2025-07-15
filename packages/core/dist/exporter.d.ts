/**
 * Core export configuration options
 */
export interface CoreExportOptions {
    /** Database file path */
    database?: string;
    /** Output directory */
    output?: string;
    /** Organization options */
    organizeByNotebooks?: boolean;
    includeDateFolders?: boolean;
    createIndexFiles?: boolean;
    /** Markdown options */
    includeFrontmatter?: boolean;
    includeMetadata?: boolean;
    includeDates?: boolean;
    includeNotebook?: boolean;
    includeId?: boolean;
    dateFormat?: 'iso' | 'locale' | 'short';
    /** Processing options */
    skipHighlights?: boolean;
    verbose?: boolean;
    dryRun?: boolean;
}
/**
 * Export progress callback
 */
export type ProgressCallback = (progress: number, message: string) => void;
/**
 * Logging callback
 */
export type LogCallback = (message: string) => void;
/**
 * Export callbacks for UI integration
 */
export interface ExportCallbacks {
    onProgress?: ProgressCallback;
    onLog?: LogCallback;
}
/**
 * Export result
 */
export interface ExportResult {
    success: boolean;
    outputPath?: string;
    error?: string;
    stats?: {
        totalNotes: number;
        notesWithContent: number;
        notesWithReferences: number;
        notebooks: number;
        orphanedNotes: number;
        filesCreated: number;
        xamlStats: any;
    };
}
/**
 * Core Logos Notes Exporter
 * Contains the main export logic that can be used by both CLI and Electron
 */
export declare class LogosNotesExporter {
    private database;
    private catalogDb?;
    private organizer;
    private fileOrganizer;
    private markdownConverter;
    private validator;
    private options;
    private callbacks;
    constructor(options: CoreExportOptions, callbacks?: ExportCallbacks);
    /**
     * Main export process
     */
    export(): Promise<ExportResult>;
    /**
     * Close database connections
     */
    close(): void;
    /**
     * Log message using callback or console
     */
    private log;
    /**
     * Report progress using callback
     */
    private progress;
    /**
     * Log organization statistics
     */
    private logStats;
    /**
     * Log file operation summary
     */
    private logFileSummary;
    /**
     * Log dry run summary
     */
    private logDryRunSummary;
    /**
     * Display Rich Text (XAML) conversion statistics
     */
    private displayXamlStats;
    /**
     * Display detailed Rich Text (XAML) conversion failures in verbose mode
     */
    private displayXamlFailures;
    /**
     * Display validation results to the user
     */
    private displayValidationResults;
}
