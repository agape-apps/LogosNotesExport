import type { OrganizedNote } from './notebook-organizer.js';
import type { NoteStyle, NoteColor, NoteIndicator, DataType, ResourceId } from './notestool-database.js';
import type { CatalogDatabase } from './catalog-database.js';
export interface NoteMetadata {
    title: string;
    created?: string;
    modified?: string;
    tags: string[];
    noteType: 'text' | 'highlight' | 'annotation';
    references: string[];
    notebook?: string;
    logosBibleBook?: number;
    noteId: number;
    style?: string;
    color?: string;
    noteStyle?: string;
    noteColor?: string;
    noteIndicator?: string;
    dataType?: string;
    resourceId?: string;
    resourceTitle?: string;
    bibleVersion?: string;
    anchorLink?: string;
    filename?: string;
    [key: string]: any;
}
export interface MetadataLookups {
    styles: Map<number, NoteStyle>;
    colors: Map<number, NoteColor>;
    indicators: Map<number, NoteIndicator>;
    dataTypes: Map<number, DataType>;
    resourceIds: Map<number, ResourceId>;
}
export interface MetadataOptions {
    /** Include creation and modification dates */
    includeDates: boolean;
    /** Include notebook information */
    includeNotebook: boolean;
    /** Include style and color information */
    includeStyle: boolean;
    /** Include enhanced metadata (note style, color, indicator, etc.) */
    includeEnhancedMetadata: boolean;
    /** Include tags derived from note content */
    includeTags: boolean;
    /** Include Logos-specific metadata */
    includeLogosData: boolean;
    /** Custom metadata extractors */
    customExtractors: MetadataExtractor[];
    /** Date format for timestamps */
    dateFormat: 'iso' | 'readable';
}
export type MetadataExtractor = (note: OrganizedNote) => Record<string, any>;
export declare const DEFAULT_METADATA_OPTIONS: MetadataOptions;
export declare class MetadataProcessor {
    private options;
    private lookups?;
    private bibleDecoder;
    private catalogDb?;
    constructor(options?: Partial<MetadataOptions>, lookups?: MetadataLookups, catalogDb?: CatalogDatabase);
    /**
     * Generate complete metadata for a note
     */
    generateMetadata(note: OrganizedNote): NoteMetadata;
    /**
     * Convert metadata to YAML frontmatter string
     */
    toYamlFrontmatter(metadata: NoteMetadata): string;
    /**
     * Extract tags from note content and metadata
     */
    private extractTags;
    /**
     * Extract potential tags from note content
     */
    private extractTagsFromContent;
    /**
     * Get human-readable note type
     */
    private getNoteType;
    /**
     * Format date according to options
     */
    private formatDate;
    /**
     * Sanitize a string for use as a tag
     */
    private sanitizeTag;
    /**
     * Escape YAML values to prevent syntax errors
     */
    private escapeYamlValue;
    /**
     * Update options
     */
    updateOptions(newOptions: Partial<MetadataOptions>): void;
    /**
     * Add custom metadata extractor
     */
    addCustomExtractor(extractor: MetadataExtractor): void;
    /**
     * Clean up style name to be more readable
     * TODO: where did "cu-tom:" come from? Consider removing this.
     */
    private cleanStyleName;
    /**
     * Extract Bible version from references
     * Looks for patterns like "bible+esv.19.86.9" and extracts "ESV"
     */
    private extractBibleVersionFromReferences;
    /**
     * Generate anchor link URL for Logos app
     */
    private generateAnchorLink;
}
