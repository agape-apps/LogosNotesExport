import type { OrganizedNote, NotebookGroup } from './types.js';
import type { ResourceId } from './notestool-database.js';
export interface FilePathInfo {
    /** Full file path */
    fullPath: string;
    /** Directory path */
    directory: string;
    /** Filename without extension */
    filename: string;
    /** Relative path from base directory */
    relativePath: string;
    /** Whether file already exists */
    exists: boolean;
}
export interface FileStructureOptions {
    /** Base output directory */
    baseDir: string;
    /** Whether to organize by notebooks */
    organizeByNotebooks: boolean;
    /** Whether to create date-based subdirectories */
    includeDateFolders: boolean;
    /** Whether to flatten structure for single notebooks */
    flattenSingleNotebook: boolean;
    /** Maximum filename length */
    maxFilenameLength: number;
    /** File extension */
    fileExtension: string;
    /** Whether to create index files */
    createIndexFiles: boolean;
}
export interface DirectoryStructure {
    /** Base directory path */
    baseDir: string;
    /** Notebook directories created */
    notebookDirs: string[];
    /** Total files that will be created */
    totalFiles: number;
    /** Index files that will be created */
    indexFiles: string[];
}
export declare const DEFAULT_FILE_OPTIONS: FileStructureOptions;
export declare class FileOrganizer {
    private options;
    private createdDirs;
    private bibleDecoder;
    private resourceIdMap?;
    constructor(options?: Partial<FileStructureOptions>, resourceIds?: ResourceId[]);
    /**
     * Plan the directory structure for notebook groups
     */
    planDirectoryStructure(notebookGroups: NotebookGroup[]): Promise<DirectoryStructure>;
    /**
     * Get the directory path for a notebook group
     */
    getNotebookDirectory(group: NotebookGroup): string;
    /**
     * Generate file path information for a note
     */
    generateFilePath(note: OrganizedNote, group: NotebookGroup, index?: number): FilePathInfo;
    /**
     * Ensure directory exists
     */
    ensureDirectory(dirPath: string): Promise<void>;
    /**
     * Write file with content
     */
    writeFile(fileInfo: FilePathInfo, content: string): Promise<void>;
    /**
     * Generate a main README.md file
     */
    generateMainIndex(notebookGroups: NotebookGroup[], stats: any): string;
    /**
     * Generate a notebook README.md file
     */
    generateNotebookIndex(group: NotebookGroup): string;
    /**
     * Generate a safe filename for a note
     */
    private generateSafeFilename;
    /**
     * Generate filename from resourceId for notes without Bible references
     * Pattern: resourceIdPart1-resourceIdPart2-noteId
     * For UUIDs in PBB resources, use only last 4 characters
     */
    private generateResourceIdFilename;
    /**
     * Get resourceId string by resourceIdId
     */
    private getResourceIdString;
    /**
     * Sanitize filename for filesystem
     */
    private sanitizeFilename;
    /**
     * Check for filename conflicts and resolve them
     */
    resolveFilenameConflicts(notes: OrganizedNote[], group: NotebookGroup): Map<OrganizedNote, FilePathInfo>;
    /**
     * Get summary of planned file operations
     */
    getFileOperationSummary(notebookGroups: NotebookGroup[]): {
        totalDirectories: number;
        totalFiles: number;
        totalIndexFiles: number;
        estimatedSize: string;
    };
    /**
     * Format bytes into human-readable string
     */
    private formatBytes;
    /**
     * Update options
     */
    updateOptions(newOptions: Partial<FileStructureOptions>): void;
    /**
     * Get current options
     */
    getOptions(): FileStructureOptions;
}
