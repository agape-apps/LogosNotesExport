import { XamlToMarkdownConverter } from './xaml-converter.js';
import { cleanXamlText } from './unicode-cleaner.js';
import { MetadataProcessor } from './metadata-processor.js';
export const DEFAULT_MARKDOWN_OPTIONS = {
    includeFrontmatter: true,
    includeMetadata: true,
    includeDates: true,
    includeKind: true,
    includeNotebook: true,
    customFields: {},
    dateFormat: 'iso',
    includeId: false
};
export class MarkdownConverter {
    constructor(options = {}, database, verbose = false, catalogDb) {
        this.options = { ...DEFAULT_MARKDOWN_OPTIONS, ...options };
        this.verbose = verbose;
        this.xamlConverter = new XamlToMarkdownConverter();
        this.xamlFailures = [];
        this.xamlStats = {
            totalNotes: 0,
            notesWithXaml: 0,
            xamlConversionsSucceeded: 0,
            xamlConversionsFailed: 0,
            plainTextNotes: 0,
            emptyNotes: 0
        };
        // Initialize enhanced metadata processor if database is provided
        if (database) {
            try {
                const lookups = {
                    styles: new Map(database.getNoteStyles().map(s => [s.noteStyleId, s])),
                    colors: new Map(database.getNoteColors().map(c => [c.noteColorId, c])),
                    indicators: new Map(database.getNoteIndicators().map(i => [i.noteIndicatorId, i])),
                    dataTypes: new Map(database.getDataTypes().map(d => [d.dataTypeId, d])),
                    resourceIds: new Map(database.getResourceIds().map(r => [r.resourceIdId, r]))
                };
                const metadataOptions = {
                    includeDates: this.options.includeDates,
                    includeNotebook: this.options.includeNotebook,
                    includeEnhancedMetadata: true,
                    includeTags: true,
                    dateFormat: this.options.dateFormat === 'iso' ? 'iso' : 'readable'
                };
                this.metadataProcessor = new MetadataProcessor(metadataOptions, lookups, catalogDb);
            }
            catch (error) {
                console.warn('Failed to initialize enhanced metadata processor:', error);
            }
        }
    }
    /**
     * Check if content contains Rich Text (XAML) patterns
     */
    containsXamlContent(content) {
        if (!content || !content.trim())
            return false;
        const xamlPatterns = [
            /<Paragraph[^>]*>/i,
            /<Run[^>]*>/i,
            /<Span[^>]*>/i,
            /Text="[^"]*"/i,
            /<Section[^>]*>/i
        ];
        return xamlPatterns.some(pattern => pattern.test(content));
    }
    /**
     * Get Rich Text (XAML) conversion statistics
     */
    getXamlConversionStats() {
        return { ...this.xamlStats };
    }
    /**
     * Get Rich Text (XAML) conversion failures for verbose reporting
     */
    getXamlConversionFailures() {
        return [...this.xamlFailures];
    }
    /**
     * Reset Rich Text (XAML) conversion statistics
     */
    resetXamlStats() {
        this.xamlStats = {
            totalNotes: 0,
            notesWithXaml: 0,
            xamlConversionsSucceeded: 0,
            xamlConversionsFailed: 0,
            plainTextNotes: 0,
            emptyNotes: 0
        };
        this.xamlFailures = [];
    }
    /**
     * Convert an organized note to markdown
     */
    convertNote(note, group, fileInfo) {
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
    generateFrontmatter(note, group, fileInfo) {
        if (this.metadataProcessor) {
            // Use enhanced metadata processor
            const metadata = this.metadataProcessor.generateMetadata(note);
            const frontmatter = { ...metadata };
            // Add file information
            if (fileInfo.filename) {
                frontmatter.filename = fileInfo.filename;
            }
            // Add custom fields
            Object.assign(frontmatter, this.options.customFields);
            return frontmatter;
        }
        else {
            // Fallback to basic frontmatter generation
            return this.generateBasicFrontmatter(note, group, fileInfo);
        }
    }
    /**
     * Generate basic frontmatter when enhanced metadata processor is not available
     */
    generateBasicFrontmatter(note, group, fileInfo) {
        const frontmatter = {};
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
        // References - always include when available
        if (note.references.length > 0) {
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
    generateBody(note, group) {
        const sections = [];
        // Track this note in Rich Text (XAML) conversion statistics
        this.xamlStats.totalNotes++;
        // Add title as H1 if not including frontmatter
        if (!this.options.includeFrontmatter) {
            const title = note.formattedTitle || this.generateTitleFromReferences(note) || 'Untitled Note';
            sections.push(`# ${title}\n`);
        }
        // Add metadata section if enabled
        if (this.options.includeMetadata && !this.options.includeFrontmatter) {
            sections.push(this.generateMetadataSection(note, group));
        }
        // Add references section if not in frontmatter - always include when available
        if (note.references.length > 0 && !this.options.includeFrontmatter) {
            sections.push(this.generateReferencesSection(note));
        }
        // Add main content with Rich Text (XAML)-to-Markdown conversion and tracking
        if (note.contentRichText && note.contentRichText.trim()) {
            const hasXaml = this.containsXamlContent(note.contentRichText);
            if (hasXaml) {
                this.xamlStats.notesWithXaml++;
                try {
                    const convertedContent = this.xamlConverter.convertToMarkdown(note.contentRichText);
                    if (convertedContent.trim()) {
                        this.xamlStats.xamlConversionsSucceeded++;
                        sections.push(convertedContent.trim());
                    }
                    else {
                        this.xamlStats.xamlConversionsFailed++;
                        if (this.verbose) {
                            this.xamlFailures.push({
                                noteId: note.id,
                                noteTitle: note.formattedTitle || 'Untitled',
                                failureType: 'empty_content',
                                xamlContentPreview: note.contentRichText.substring(0, 150)
                            });
                        }
                        sections.push('*[This note contains formatting that could not be converted.]*');
                    }
                }
                catch (error) {
                    this.xamlStats.xamlConversionsFailed++;
                    if (this.verbose) {
                        this.xamlFailures.push({
                            noteId: note.id,
                            noteTitle: note.formattedTitle || 'Untitled',
                            failureType: 'exception',
                            errorMessage: error instanceof Error ? error.message : String(error),
                            xamlContentPreview: note.contentRichText.substring(0, 150)
                        });
                    }
                    // If Rich Text (XAML) conversion fails, extract plain text as fallback
                    const plainText = this.extractPlainTextFromXaml(note.contentRichText);
                    if (plainText.trim()) {
                        sections.push(plainText.trim());
                    }
                    else {
                        sections.push('*[This note contains content that could not be processed.]*');
                    }
                }
            }
            else {
                // Plain text content, no Rich Text (XAML)
                this.xamlStats.plainTextNotes++;
                sections.push(note.contentRichText.trim());
            }
        }
        else {
            // If no content, add a note about it (unless it's a highlight - they get special treatment)
            if (note.kind !== 1) {
                this.xamlStats.emptyNotes++;
                sections.push('*[This note appears to be empty.]*');
            }
            else {
                this.xamlStats.emptyNotes++;
            }
        }
        // Add highlight information if present
        if (note.kind === 1) {
            // Extract reference for highlighted passage - only use actual Bible references
            let reference = '';
            if (note.references.length > 0 && note.references[0]) {
                const formattedRef = note.references[0].formatted;
                if (typeof formattedRef === 'string' && formattedRef.trim()) {
                    reference = formattedRef.trim();
                }
            }
            if (reference) {
                sections.push(`Highlighted passage: ${reference}`);
            }
            else {
                sections.push('This is a highlighted passage');
            }
        }
        return sections.join('\n\n');
    }
    /**
     * Generate metadata section for markdown body
     */
    generateMetadataSection(note, group) {
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
    generateReferencesSection(note) {
        const lines = ['## References\n'];
        for (const ref of note.references) {
            lines.push(`- ${ref.formatted}`);
        }
        return lines.join('\n');
    }
    /**
     * Serialize frontmatter to YAML
     */
    serializeFrontmatter(frontmatter) {
        const lines = ['---'];
        // Define the preferred field order for better readability
        const fieldOrder = [
            'title', 'created', 'modified', 'tags', 'noteType', 'references',
            'noteId', 'notebook', 'logosBibleBook', 'bibleVersion', 'noteStyle',
            'noteColor', 'noteIndicator', 'dataType', 'resourceId', 'resourceTitle', 'anchorLink', 'filename'
        ];
        // Add fields in the preferred order first
        for (const key of fieldOrder) {
            if (frontmatter[key] !== null && frontmatter[key] !== undefined) {
                lines.push(this.serializeYamlValue(key, frontmatter[key], 0));
            }
        }
        // Add any remaining fields that weren't in the preferred order
        for (const [key, value] of Object.entries(frontmatter)) {
            if (value === null || value === undefined || fieldOrder.includes(key)) {
                continue;
            }
            lines.push(this.serializeYamlValue(key, value, 0));
        }
        return lines.join('\n');
    }
    /**
     * Serialize a YAML value with proper formatting
     */
    serializeYamlValue(key, value, indent = 0) {
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
                }
                else {
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
    formatYamlScalar(value) {
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
    getNoteTypeName(kind) {
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
    formatDate(dateStr) {
        const date = new Date(dateStr);
        switch (this.options.dateFormat) {
            case 'locale':
                return date.toLocaleDateString();
            case 'short':
                const isoString = date.toISOString();
                return isoString.split('T')[0] || isoString; // YYYY-MM-DD
            case 'iso':
            default:
                return date.toISOString();
        }
    }
    /**
     * Generate a title from references if no title exists
     */
    generateTitleFromReferences(note) {
        if (note.references.length === 0)
            return null;
        // Use the first reference as title
        const firstRef = note.references[0];
        if (firstRef && firstRef.formatted) {
            return String(firstRef.formatted);
        }
        return null;
    }
    /**
     * Extract plain text from Rich Text (XAML) as fallback
     */
    extractPlainTextFromXaml(xaml) {
        if (!xaml)
            return '';
        // Extract text from Text attributes
        const textMatches = xaml.match(/Text="([^"]*?)"/g) || [];
        const texts = textMatches.map(match => cleanXamlText(match.replace(/Text="([^"]*?)"/, '$1').trim())).filter(text => text);
        return texts.join(' ');
    }
    /**
     * Extract tags from a note (placeholder for future implementation)
     */
    extractTags(note) {
        // For now, return basic tags based on note type and content
        const tags = [];
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
                if (book && typeof book === 'string') {
                    tags.push(book.toLowerCase().replace(/\s+/g, '-'));
                }
            }
        }
        return tags;
    }
    /**
     * Count words in text
     */
    countWords(text) {
        if (!text || text.trim().length === 0)
            return 0;
        // Remove markdown formatting and count words
        const plainText = text
            .replace(/[#*_`~]/g, '') // Remove markdown characters
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
            .trim();
        if (plainText.length === 0)
            return 0;
        return plainText.split(/\s+/).length;
    }
    /**
     * Update converter options
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }
    /**
     * Get current options
     */
    getOptions() {
        return { ...this.options };
    }
    /**
     * Convert multiple notes for a notebook group
     */
    convertNotebook(group, fileMap) {
        const results = new Map();
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
    getConversionStats(results) {
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
