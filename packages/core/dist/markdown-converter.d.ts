import type { OrganizedNote, NotebookGroup, FilePathInfo } from './types.js';
import type { NotesToolDatabase } from './notestool-database.js';
import type { CatalogDatabase } from './catalog-database.js';
export interface MarkdownOptions {
    /** Include YAML frontmatter */
    includeFrontmatter: boolean;
    /** Include note metadata in content */
    includeMetadata: boolean;
    /** Include creation/modification dates */
    includeDates: boolean;
    /** Include note kind/type */
    includeKind: boolean;
    /** Include notebook information */
    includeNotebook: boolean;
    /** Custom frontmatter fields */
    customFields: Record<string, any>;
    /** Date format for display */
    dateFormat: 'iso' | 'locale' | 'short';
    /** Whether to include note ID */
    includeId: boolean;
}
export interface XamlConversionStats {
    /** Total notes processed */
    totalNotes: number;
    /** Notes that contained Rich Text (XAML) content */
    notesWithXaml: number;
    /** Rich Text (XAML) notes successfully converted */
    xamlConversionsSucceeded: number;
    /** Rich Text (XAML) notes that failed conversion */
    xamlConversionsFailed: number;
    /** Notes with plain text only */
    plainTextNotes: number;
    /** Notes with empty content */
    emptyNotes: number;
}
export interface XamlConversionFailure {
    noteId: number;
    noteTitle: string;
    failureType: 'empty_content' | 'exception';
    errorMessage?: string;
    xamlContentPreview: string;
}
export interface MarkdownResult {
    /** Final markdown content */
    content: string;
    /** YAML frontmatter object */
    frontmatter: Record<string, any>;
    /** Content without frontmatter */
    body: string;
    /** Word count */
    wordCount: number;
    /** Character count */
    characterCount: number;
}
export declare const DEFAULT_MARKDOWN_OPTIONS: MarkdownOptions;
export declare class MarkdownConverter {
    private options;
    private xamlConverter;
    private metadataProcessor?;
    private xamlStats;
    private verbose;
    private xamlFailures;
    constructor(options?: Partial<MarkdownOptions>, database?: NotesToolDatabase, verbose?: boolean, catalogDb?: CatalogDatabase);
    /**
     * Check if content contains Rich Text (XAML) patterns
     */
    private containsXamlContent;
    /**
     * Get Rich Text (XAML) conversion statistics
     */
    getXamlConversionStats(): XamlConversionStats;
    /**
     * Get Rich Text (XAML) conversion failures for verbose reporting
     */
    getXamlConversionFailures(): XamlConversionFailure[];
    /**
     * Reset Rich Text (XAML) conversion statistics
     */
    resetXamlStats(): void;
    /**
     * Convert an organized note to markdown
     */
    convertNote(note: OrganizedNote, group: NotebookGroup, fileInfo: FilePathInfo): MarkdownResult;
    /**
     * Generate YAML frontmatter for a note
     */
    private generateFrontmatter;
    /**
     * Generate basic frontmatter when enhanced metadata processor is not available
     */
    private generateBasicFrontmatter;
    /**
     * Generate the body content of the markdown note
     */
    private generateBody;
    /**
     * Generate metadata section for markdown body
     */
    private generateMetadataSection;
    /**
     * Generate references section for markdown body
     */
    private generateReferencesSection;
    /**
     * Serialize frontmatter to YAML
     */
    private serializeFrontmatter;
    /**
     * Serialize a YAML value with proper formatting
     */
    private serializeYamlValue;
    /**
     * Format a scalar value for YAML
     */
    private formatYamlScalar;
    /**
     * Get human-readable note type name
     */
    private getNoteTypeName;
    /**
     * Format date according to options
     */
    private formatDate;
    /**
     * Generate a title from references if no title exists
     */
    private generateTitleFromReferences;
    /**
     * Extract plain text from Rich Text (XAML) as fallback
     */
    private extractPlainTextFromXaml;
    /**
     * Extract tags from a note (placeholder for future implementation)
     */
    private extractTags;
    /**
     * Count words in text
     */
    private countWords;
    /**
     * Update converter options
     */
    updateOptions(newOptions: Partial<MarkdownOptions>): void;
    /**
     * Get current options
     */
    getOptions(): MarkdownOptions;
    /**
     * Convert multiple notes for a notebook group
     */
    convertNotebook(group: NotebookGroup, fileMap: Map<OrganizedNote, FilePathInfo>): Map<OrganizedNote, MarkdownResult>;
    /**
     * Get statistics for converted notes
     */
    getConversionStats(results: Map<OrganizedNote, MarkdownResult>): {
        totalNotes: number;
        totalWords: number;
        totalCharacters: number;
        notesWithContent: number;
        averageWordCount: number;
    };
}
