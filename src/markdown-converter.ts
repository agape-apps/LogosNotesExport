import type { OrganizedNote, NotebookGroup, FilePathInfo } from './types.js';
import { XamlToMarkdownConverter } from './xaml-converter.js';
import { cleanXamlText } from './unicode-cleaner.js';
import { MetadataProcessor, type MetadataLookups, type MetadataOptions } from './metadata-processor.js';
import type { NotesToolDatabase } from './notestool-database.js';

export interface MarkdownOptions {
  /** Include YAML frontmatter */
  includeFrontmatter: boolean;
  /** Include note metadata in content */
  includeMetadata: boolean;
  /** Include creation/modification dates */
  includeDates: boolean;
  /** Include references section */
  includeReferences: boolean;
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

export const DEFAULT_MARKDOWN_OPTIONS: MarkdownOptions = {
  includeFrontmatter: true,
  includeMetadata: true,
  includeDates: true,
  includeReferences: true,
  includeKind: true,
  includeNotebook: true,
  customFields: {},
  dateFormat: 'iso',
  includeId: false
};

export class MarkdownConverter {
  private options: MarkdownOptions;
  private xamlConverter: XamlToMarkdownConverter;
  private metadataProcessor?: MetadataProcessor;

  constructor(options: Partial<MarkdownOptions> = {}, database?: NotesToolDatabase) {
    this.options = { ...DEFAULT_MARKDOWN_OPTIONS, ...options };
    this.xamlConverter = new XamlToMarkdownConverter();
    
    // Initialize enhanced metadata processor if database is provided
    if (database) {
      try {
        const lookups: MetadataLookups = {
          styles: new Map(database.getNoteStyles().map(s => [s.noteStyleId, s])),
          colors: new Map(database.getNoteColors().map(c => [c.noteColorId, c])),
          indicators: new Map(database.getNoteIndicators().map(i => [i.noteIndicatorId, i])),
          dataTypes: new Map(database.getDataTypes().map(d => [d.dataTypeId, d])),
          resourceIds: new Map(database.getResourceIds().map(r => [r.resourceIdId, r]))
        };
        
        const metadataOptions: Partial<MetadataOptions> = {
          includeDates: this.options.includeDates,
          includeNotebook: this.options.includeNotebook,
          includeReferences: this.options.includeReferences,
          includeEnhancedMetadata: true,
          includeTags: true,
          dateFormat: this.options.dateFormat === 'iso' ? 'iso' : 'readable'
        };
        
        this.metadataProcessor = new MetadataProcessor(metadataOptions, lookups);
      } catch (error) {
        console.warn('Failed to initialize enhanced metadata processor:', error);
      }
    }
  }

  /**
   * Convert an organized note to markdown
   */
  public convertNote(note: OrganizedNote, group: NotebookGroup, fileInfo: FilePathInfo): MarkdownResult {
    const frontmatter = this.generateFrontmatter(note, group, fileInfo);
    const body = this.generateBody(note, group);
    
    let content = '';
    if (this.options.includeFrontmatter && Object.keys(frontmatter).length > 0) {
      content += this.serializeFrontmatter(frontmatter);
      content += '\n---\n\n';
    }
    content += body;

    return {
      content,
      frontmatter,
      body,
      wordCount: this.countWords(body),
      characterCount: body.length
    };
  }

  /**
   * Generate YAML frontmatter for a note
   */
  private generateFrontmatter(note: OrganizedNote, group: NotebookGroup, fileInfo: FilePathInfo): Record<string, any> {
    if (this.metadataProcessor) {
      // Use enhanced metadata processor
      const metadata = this.metadataProcessor.generateMetadata(note);
      const frontmatter: Record<string, any> = { ...metadata };
      
      // Add file information
      if (fileInfo.filename) {
        frontmatter.filename = fileInfo.filename;
      }
      
      // Add custom fields
      Object.assign(frontmatter, this.options.customFields);
      
      return frontmatter;
    } else {
      // Fallback to basic frontmatter generation
      return this.generateBasicFrontmatter(note, group, fileInfo);
    }
  }

  /**
   * Generate basic frontmatter when enhanced metadata processor is not available
   */
  private generateBasicFrontmatter(note: OrganizedNote, group: NotebookGroup, fileInfo: FilePathInfo): Record<string, any> {
    const frontmatter: Record<string, any> = {};

    // Title
    frontmatter.title = note.formattedTitle || this.generateTitleFromReferences(note) || 'Untitled Note';

    // Dates
    if (this.options.includeDates) {
      frontmatter.created = this.formatDate(note.createdDate);
      if (note.modifiedDate) {
        frontmatter.modified = this.formatDate(note.modifiedDate);
      }
    }

    // Note kind/type
    if (this.options.includeKind) {
      frontmatter.noteType = this.getNoteTypeName(note.kind);
    }

    // Note ID
    if (this.options.includeId) {
      frontmatter.noteId = note.id;
    }

    // Notebook information
    if (this.options.includeNotebook && group.notebook) {
      frontmatter.notebook = group.notebook.title;
    }

    // References
    if (this.options.includeReferences && note.references.length > 0) {
      frontmatter.references = note.references.map(ref => ref.formatted);
    }

    // Tags
    const tags = this.extractTags(note);
    if (tags.length > 0) {
      frontmatter.tags = tags;
    }

    // File information
    if (fileInfo.filename) {
      frontmatter.filename = fileInfo.filename;
    }

    // Custom fields
    Object.assign(frontmatter, this.options.customFields);

    return frontmatter;
  }

  /**
   * Generate the body content of the markdown note
   */
  private generateBody(note: OrganizedNote, group: NotebookGroup): string {
    const sections: string[] = [];

    // Add title as H1 if not including frontmatter
    if (!this.options.includeFrontmatter) {
      const title = note.formattedTitle || this.generateTitleFromReferences(note) || 'Untitled Note';
      sections.push(`# ${title}\n`);
    }

    // Add metadata section if enabled
    if (this.options.includeMetadata && !this.options.includeFrontmatter) {
      sections.push(this.generateMetadataSection(note, group));
    }

    // Add references section if enabled and not in frontmatter
    if (this.options.includeReferences && note.references.length > 0 && !this.options.includeFrontmatter) {
      sections.push(this.generateReferencesSection(note));
    }

    // Add main content with XAML-to-Markdown conversion
    if (note.contentRichText && note.contentRichText.trim()) {
      try {
        const convertedContent = this.xamlConverter.convertToMarkdown(note.contentRichText);
        if (convertedContent.trim()) {
          sections.push(convertedContent.trim());
        } else {
          // If conversion resulted in empty content, use fallback
          sections.push('*[This note contains formatting that could not be converted.]*');
        }
      } catch (error) {
        // If XAML conversion fails, extract plain text as fallback
        const plainText = this.extractPlainTextFromXaml(note.contentRichText);
        if (plainText.trim()) {
          sections.push(plainText.trim());
        } else {
          sections.push('*[This note contains content that could not be processed.]*');
        }
      }
    } else {
      // If no content, add a note about it
      sections.push('*[This note appears to be empty or contains only formatting.]*');
    }

    // Add highlight information if present
    if (note.kind === 1) {
      sections.push('\n---\n\n*This is a highlighted passage.*');
    }

    return sections.join('\n\n');
  }

  /**
   * Generate metadata section for markdown body
   */
  private generateMetadataSection(note: OrganizedNote, group: NotebookGroup): string {
    const lines = ['## Metadata\n'];

    lines.push(`**Type:** ${this.getNoteTypeName(note.kind)}  `);
    lines.push(`**Created:** ${this.formatDate(note.createdDate)}  `);
    if (note.modifiedDate) {
      lines.push(`**Modified:** ${this.formatDate(note.modifiedDate)}  `);
    }

    if (group.notebook) {
      lines.push(`**Notebook:** ${group.notebook.title || 'Untitled'}  `);
    }

    if (this.options.includeId) {
      lines.push(`**ID:** ${note.id}  `);
    }

    return lines.join('\n');
  }

  /**
   * Generate references section for markdown body
   */
  private generateReferencesSection(note: OrganizedNote): string {
    const lines = ['## References\n'];
    
    for (const ref of note.references) {
      lines.push(`- ${ref.formatted}`);
    }

    return lines.join('\n');
  }

  /**
   * Serialize frontmatter to YAML
   */
  private serializeFrontmatter(frontmatter: Record<string, any>): string {
    const lines = ['---'];
    
    for (const [key, value] of Object.entries(frontmatter)) {
      if (value === null || value === undefined) {
        continue;
      }
      
      lines.push(this.serializeYamlValue(key, value, 0));
    }
    
    return lines.join('\n');
  }

  /**
   * Serialize a YAML value with proper formatting
   */
  private serializeYamlValue(key: string, value: any, indent: number = 0): string {
    const prefix = '  '.repeat(indent);
    
    if (value === null || value === undefined) {
      return `${prefix}${key}: null`;
    }
    
    if (typeof value === 'string') {
      // Escape quotes and handle multiline strings
      if (value.includes('\n') || value.includes('"') || value.includes('\'')) {
        const escapedValue = value.replace(/"/g, '\\"');
        return `${prefix}${key}: "${escapedValue}"`;
      }
      return `${prefix}${key}: "${value}"`;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return `${prefix}${key}: ${value}`;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${prefix}${key}: []`;
      }
      
      const lines = [`${prefix}${key}:`];
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          lines.push(`${prefix}  -`);
          for (const [subKey, subValue] of Object.entries(item)) {
            lines.push(this.serializeYamlValue(subKey, subValue, indent + 2));
          }
        } else {
          lines.push(`${prefix}  - ${this.formatYamlScalar(item)}`);
        }
      }
      return lines.join('\n');
    }
    
    if (typeof value === 'object') {
      const lines = [`${prefix}${key}:`];
      for (const [subKey, subValue] of Object.entries(value)) {
        lines.push(this.serializeYamlValue(subKey, subValue, indent + 1));
      }
      return lines.join('\n');
    }
    
    return `${prefix}${key}: ${String(value)}`;
  }

  /**
   * Format a scalar value for YAML
   */
  private formatYamlScalar(value: any): string {
    if (typeof value === 'string') {
      if (value.includes('"') || value.includes('\'') || value.includes('\n')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  /**
   * Get human-readable note type name
   */
  private getNoteTypeName(kind: number): string {
    switch (kind) {
      case 0: return 'note';
      case 1: return 'highlight';
      case 2: return 'annotation';
      default: return 'unknown';
    }
  }

  /**
   * Format date according to options
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    
    switch (this.options.dateFormat) {
      case 'locale':
        return date.toLocaleDateString();
      case 'short':
        const isoString = date.toISOString();
        return isoString.split('T')[0]; // YYYY-MM-DD
      case 'iso':
      default:
        return date.toISOString();
    }
  }

  /**
   * Generate a title from references if no title exists
   */
  private generateTitleFromReferences(note: OrganizedNote): string | null {
    if (note.references.length === 0) return null;
    
    // Use the first reference as title
    const firstRef = note.references[0];
    if (firstRef && firstRef.formatted) {
      return String(firstRef.formatted);
    }
    return null;
  }

  /**
   * Extract plain text from XAML as fallback
   */
  private extractPlainTextFromXaml(xaml: string): string {
    if (!xaml) return '';
    
    // Extract text from Text attributes
    const textMatches = xaml.match(/Text="([^"]*?)"/g) || [];
    const texts = textMatches.map(match => 
      cleanXamlText(match.replace(/Text="([^"]*?)"/, '$1').trim())
    ).filter(text => text);

    return texts.join(' ');
  }

  /**
   * Extract tags from a note (placeholder for future implementation)
   */
  private extractTags(note: OrganizedNote): string[] {
    // For now, return basic tags based on note type and content
    const tags: string[] = [];

    // Add note type tag
    switch (note.kind) {
      case 0:
        tags.push('note');
        break;
      case 1:
        tags.push('highlight');
        break;
      case 2:
        tags.push('annotation');
        break;
      default:
        tags.push('note');
    }

    // Add reference-based tags
    if (note.references.length > 0) {
      tags.push('scripture');
      
      // Add book tags for unique books
      const books = [...new Set(note.references.map(ref => ref.bookName).filter(Boolean))];
      for (const book of books.slice(0, 3)) { // Limit to 3 book tags
        if (book) {
          tags.push(book.toLowerCase().replace(/\s+/g, '-'));
        }
      }
    }

    return tags;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    // Remove markdown formatting and count words
    const plainText = text
      .replace(/[#*_`~]/g, '') // Remove markdown characters
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
      .trim();
    
    if (plainText.length === 0) return 0;
    
    return plainText.split(/\s+/).length;
  }

  /**
   * Update converter options
   */
  public updateOptions(newOptions: Partial<MarkdownOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current options
   */
  public getOptions(): MarkdownOptions {
    return { ...this.options };
  }

  /**
   * Convert multiple notes for a notebook group
   */
  public convertNotebook(group: NotebookGroup, fileMap: Map<OrganizedNote, FilePathInfo>): Map<OrganizedNote, MarkdownResult> {
    const results = new Map<OrganizedNote, MarkdownResult>();
    
    for (const note of group.notes) {
      const fileInfo = fileMap.get(note);
      if (fileInfo) {
        const result = this.convertNote(note, group, fileInfo);
        results.set(note, result);
      }
    }
    
    return results;
  }

  /**
   * Get statistics for converted notes
   */
  public getConversionStats(results: Map<OrganizedNote, MarkdownResult>): {
    totalNotes: number;
    totalWords: number;
    totalCharacters: number;
    notesWithContent: number;
    averageWordCount: number;
  } {
    let totalWords = 0;
    let totalCharacters = 0;
    let notesWithContent = 0;

    for (const result of results.values()) {
      totalWords += result.wordCount;
      totalCharacters += result.characterCount;
      if (result.wordCount > 0) {
        notesWithContent++;
      }
    }

    return {
      totalNotes: results.size,
      totalWords,
      totalCharacters,
      notesWithContent,
      averageWordCount: results.size > 0 ? Math.round(totalWords / results.size) : 0
    };
  }
} 