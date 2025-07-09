import type { OrganizedNote } from './notebook-organizer.js';
import type { DecodedReference } from './reference-decoder.js';

export interface NoteMetadata {
  title: string;
  created: string;
  modified?: string;
  tags: string[];
  noteType: 'text' | 'highlight' | 'annotation';
  references: string[];
  notebook?: string;
  notebookId?: string;
  logosBibleBook?: number;
  noteId: number;
  style?: string;
  color?: string;
  [key: string]: any; // Allow custom metadata
}

export interface MetadataOptions {
  /** Include creation and modification dates */
  includeDates: boolean;
  /** Include notebook information */
  includeNotebook: boolean;
  /** Include style and color information */
  includeStyle: boolean;
  /** Include all Bible references */
  includeReferences: boolean;
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

export const DEFAULT_METADATA_OPTIONS: MetadataOptions = {
  includeDates: true,
  includeNotebook: true,
  includeStyle: false,
  includeReferences: true,
  includeTags: true,
  includeLogosData: false,
  customExtractors: [],
  dateFormat: 'iso'
};

export class MetadataProcessor {
  private options: MetadataOptions;

  constructor(options: Partial<MetadataOptions> = {}) {
    this.options = { ...DEFAULT_METADATA_OPTIONS, ...options };
  }

  /**
   * Generate complete metadata for a note
   */
  public generateMetadata(note: OrganizedNote): NoteMetadata {
    const metadata: NoteMetadata = {
      title: note.formattedTitle,
      created: this.formatDate(note.createdDate),
      tags: [],
      noteType: this.getNoteType(note.kind),
      references: [],
      noteId: note.id
    };

    // Add modification date
    if (this.options.includeDates && note.modifiedDate) {
      metadata.modified = this.formatDate(note.modifiedDate);
    }

    // Add notebook information
    if (this.options.includeNotebook && note.notebook) {
      metadata.notebook = note.notebook.title || 'Untitled Notebook';
      metadata.notebookId = note.notebook.externalId;
    }

    // Add Bible references
    if (this.options.includeReferences && note.references.length > 0) {
      metadata.references = note.references.map(ref => ref.formatted);
      // Set primary Bible book if available
      if (note.references[0]) {
        metadata.logosBibleBook = note.references[0].anchorBookId;
      }
    }

    // Add anchor Bible book from note
    if (note.anchorBibleBook) {
      metadata.logosBibleBook = note.anchorBibleBook;
    }

    // Add style and color information
    if (this.options.includeStyle) {
      if (note.noteStyleId) {
        metadata.style = `style-${note.noteStyleId}`;
      }
      if (note.noteColorId) {
        metadata.color = `color-${note.noteColorId}`;
      }
    }

    // Add tags
    if (this.options.includeTags) {
      metadata.tags = this.extractTags(note);
    }

    // Add Logos-specific data
    if (this.options.includeLogosData) {
      metadata.logosExternalId = note.externalId;
      if (note.noteStyleId) metadata.logosStyleId = note.noteStyleId;
      if (note.noteColorId) metadata.logosColorId = note.noteColorId;
    }

    // Apply custom extractors
    for (const extractor of this.options.customExtractors) {
      const customData = extractor(note);
      Object.assign(metadata, customData);
    }

    return metadata;
  }

  /**
   * Convert metadata to YAML frontmatter string
   */
  public toYamlFrontmatter(metadata: NoteMetadata): string {
    const yamlLines = ['---'];

    // Title (always first)
    yamlLines.push(`title: ${this.escapeYamlValue(metadata.title)}`);

    // Dates
    yamlLines.push(`created: ${metadata.created}`);
    if (metadata.modified) {
      yamlLines.push(`modified: ${metadata.modified}`);
    }

    // Note type
    yamlLines.push(`noteType: ${metadata.noteType}`);

    // Notebook
    if (metadata.notebook) {
      yamlLines.push(`notebook: ${this.escapeYamlValue(metadata.notebook)}`);
    }

    // Bible references
    if (metadata.references.length > 0) {
      yamlLines.push('references:');
      metadata.references.forEach(ref => {
        yamlLines.push(`  - ${this.escapeYamlValue(ref)}`);
      });
    }

    // Tags
    if (metadata.tags.length > 0) {
      yamlLines.push('tags:');
      metadata.tags.forEach(tag => {
        yamlLines.push(`  - ${this.escapeYamlValue(tag)}`);
      });
    }

    // Bible book
    if (metadata.logosBibleBook) {
      yamlLines.push(`logosBibleBook: ${metadata.logosBibleBook}`);
    }

    // Note ID
    yamlLines.push(`noteId: ${metadata.noteId}`);

    // Additional metadata (excluding standard fields)
    const standardFields = new Set([
      'title', 'created', 'modified', 'noteType', 'notebook', 'notebookId',
      'references', 'tags', 'logosBibleBook', 'noteId'
    ]);

    for (const [key, value] of Object.entries(metadata)) {
      if (!standardFields.has(key) && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          yamlLines.push(`${key}:`);
          value.forEach((item: any) => {
            yamlLines.push(`  - ${this.escapeYamlValue(String(item))}`);
          });
        } else if (typeof value === 'object') {
          yamlLines.push(`${key}:`);
          for (const [subKey, subValue] of Object.entries(value as any)) {
            yamlLines.push(`  ${subKey}: ${this.escapeYamlValue(String(subValue))}`);
          }
        } else {
          yamlLines.push(`${key}: ${this.escapeYamlValue(String(value))}`);
        }
      }
    }

    yamlLines.push('---');
    yamlLines.push(''); // Empty line after frontmatter

    return yamlLines.join('\\n');
  }

  /**
   * Extract tags from note content and metadata
   */
  private extractTags(note: OrganizedNote): string[] {
    const tags = new Set<string>();

    // Add note type as tag
    tags.add(this.getNoteType(note.kind));

    // Add notebook as tag
    if (note.notebook?.title) {
      const notebookTag = this.sanitizeTag(note.notebook.title);
      if (notebookTag) tags.add(notebookTag);
    }

    // Add Bible book tags
    if (note.references.length > 0) {
      const uniqueBooks = new Set(note.references.map(ref => ref.bookName));
      uniqueBooks.forEach(bookName => {
        const bookTag = this.sanitizeTag(bookName);
        if (bookTag) tags.add(bookTag);
      });
    }

    // Extract potential tags from content
    if (note.contentRichText) {
      const contentTags = this.extractTagsFromContent(note.contentRichText);
      contentTags.forEach(tag => tags.add(tag));
    }

    return Array.from(tags).sort();
  }

  /**
   * Extract potential tags from note content
   */
  private extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];

    // Clean content for analysis
    const cleanContent = content
      .replace(/<[^>]+>/g, ' ') // Remove XAML tags
      .replace(/\\s+/g, ' ')
      .toLowerCase()
      .trim();

    // Common theological and study terms
    const theologicalTerms = [
      'prayer', 'worship', 'faith', 'grace', 'mercy', 'love', 'hope',
      'salvation', 'gospel', 'cross', 'resurrection', 'trinity',
      'discipleship', 'ministry', 'mission', 'evangelism', 'prophecy',
      'covenant', 'blessing', 'forgiveness', 'righteousness', 'holiness'
    ];

    // Look for theological terms
    theologicalTerms.forEach(term => {
      if (cleanContent.includes(term)) {
        tags.push(term);
      }
    });

    // Look for hashtag-style tags (#tag)
    const hashtagMatches = content.match(/#\\w+/g);
    if (hashtagMatches) {
      hashtagMatches.forEach(match => {
        const tag = match.substring(1).toLowerCase();
        if (tag.length > 2) tags.push(tag);
      });
    }

    return tags;
  }

  /**
   * Get human-readable note type
   */
  private getNoteType(kind: number): 'text' | 'highlight' | 'annotation' {
    switch (kind) {
      case 0: return 'text';
      case 1: return 'highlight';
      default: return 'annotation';
    }
  }

  /**
   * Format date according to options
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    
    if (this.options.dateFormat === 'readable') {
      return date.toLocaleString();
    } else {
      return date.toISOString();
    }
  }

  /**
   * Sanitize a string for use as a tag
   */
  private sanitizeTag(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
      .replace(/\\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 30); // Limit length
  }

  /**
   * Escape YAML values to prevent syntax errors
   */
  private escapeYamlValue(value: string): string {
    if (!value) return '\"\"';

    // Check if value needs quoting
    const needsQuoting = /^[\\s]*$|[:\\[\\]{},\"|'>]|^[&*!|>%@`]/.test(value) ||
                        /^(true|false|null|yes|no|on|off)$/i.test(value) ||
                        /^[0-9]/.test(value);

    if (needsQuoting) {
      // Escape double quotes and backslashes
      const escaped = value.replace(/\\\\/g, '\\\\\\\\').replace(/\"/g, '\\\\\"');
      return `\"${escaped}\"`;
    }

    return value;
  }

  /**
   * Update options
   */
  public updateOptions(newOptions: Partial<MetadataOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Add custom metadata extractor
   */
  public addCustomExtractor(extractor: MetadataExtractor): void {
    this.options.customExtractors.push(extractor);
  }
} 