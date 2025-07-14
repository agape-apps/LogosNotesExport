import type { OrganizedNote, NotebookGroup } from './types.js';
export interface ValidationOptions {
    /** Check that all notes were exported */
    checkNoteCount: boolean;
    /** Check file structure integrity */
    checkFileStructure: boolean;
    /** Verify frontmatter format */
    checkFrontmatter: boolean;
    /** Check Bible reference accuracy */
    checkReferences: boolean;
    /** Sample size for content validation (0 = all files) */
    sampleSize: number;
}
export interface ValidationResult {
    /** Overall validation status */
    isValid: boolean;
    /** List of issues found */
    issues: ValidationIssue[];
    /** Validation statistics */
    stats: ValidationStats;
    /** Summary message */
    summary: string;
}
export interface ValidationIssue {
    /** Issue severity */
    severity: 'error' | 'warning' | 'info';
    /** Issue type */
    type: 'file' | 'content' | 'structure' | 'format';
    /** Issue description */
    message: string;
    /** Related file path */
    filePath?: string;
    /** Additional context */
    details?: string;
}
export interface ValidationStats {
    /** Total files checked */
    filesChecked: number;
    /** Files with issues */
    filesWithIssues: number;
    /** Total issues found */
    totalIssues: number;
    /** Issues by severity */
    issuesBySeverity: Record<string, number>;
    /** Average file size */
    averageFileSize: number;
}
export declare class ExportValidator {
    private options;
    constructor(options?: Partial<ValidationOptions>);
    /**
     * Validate the exported notes
     */
    validateExport(exportDir: string, originalNotes: OrganizedNote[], notebookGroups: NotebookGroup[]): Promise<ValidationResult>;
    /**
     * Validate the overall file structure
     */
    private validateFileStructure;
    /**
     * Validate that all notes were exported
     */
    private validateNoteCount;
    /**
     * Validate content quality
     */
    private validateContent;
    /**
     * Lint YAML content for syntax validity
     */
    private lintYaml;
    /**
     * Validate YAML frontmatter format
     */
    private validateFrontmatter;
    /**
     * Validate Bible references
     */
    private validateReferences;
    /**
     * Find all markdown files in the export directory
     */
    private findMarkdownFiles;
    /**
     * Basic Bible reference validation
     */
    private isValidReference;
    /**
     * Sanitize filename for cross-platform compatibility
     */
    private sanitizeFilename;
    /**
     * Build validation result
     */
    private buildResult;
    /**
     * Update validation options
     */
    updateOptions(newOptions: Partial<ValidationOptions>): void;
    /**
     * Get current validation options
     */
    getOptions(): ValidationOptions;
}
