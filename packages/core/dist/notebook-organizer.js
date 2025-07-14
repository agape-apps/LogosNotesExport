import { BibleReferenceDecoder } from './reference-decoder.js';
export class NotebookOrganizer {
    constructor(database, options = {}) {
        this.database = database;
        this.referenceDecoder = new BibleReferenceDecoder();
        this.options = options;
    }
    /**
     * Organize all active notes by notebooks with references
     */
    async organizeNotes() {
        let notes = this.database.getActiveNotes();
        // Filter out highlights if requested
        if (this.options.skipHighlights) {
            notes = notes.filter((note) => note.kind !== 1); // 1 = highlight
        }
        const notebooks = this.database.getActiveNotebooks();
        const allReferences = this.database.getBibleReferences();
        const allTextRanges = this.database.getNoteAnchorTextRanges();
        // Create a map for quick notebook lookup
        const notebookMap = new Map();
        notebooks.forEach((nb) => notebookMap.set(nb.externalId, nb));
        // Create a map for quick reference lookup
        const referencesMap = new Map();
        allReferences.forEach((ref) => {
            const decoded = this.referenceDecoder.decodeReference(ref.reference, ref.bibleBook);
            if (decoded) {
                if (!referencesMap.has(ref.noteId)) {
                    referencesMap.set(ref.noteId, []);
                }
                const noteReferences = referencesMap.get(ref.noteId);
                if (noteReferences) {
                    noteReferences.push(decoded);
                }
            }
        });
        // Create a map for quick text range lookup (using first range for each note)
        const textRangesMap = new Map();
        allTextRanges.forEach((range) => {
            if (!textRangesMap.has(range.noteId)) {
                textRangesMap.set(range.noteId, range);
            }
        });
        // Process notes and organize by notebook
        const notebookGroups = new Map();
        const orphanedGroup = {
            notebook: null,
            notes: [],
            totalNotes: 0,
            sanitizedFolderName: 'No Notebook'
        };
        for (const note of notes) {
            const organizedNote = this.processNote(note, notebookMap, referencesMap, textRangesMap);
            if (organizedNote.notebook) {
                const notebookId = organizedNote.notebook.externalId;
                if (!notebookGroups.has(notebookId)) {
                    notebookGroups.set(notebookId, {
                        notebook: organizedNote.notebook,
                        notes: [],
                        totalNotes: 0,
                        sanitizedFolderName: this.sanitizeFilename(organizedNote.notebook.title || 'untitled-notebook')
                    });
                }
                const group = notebookGroups.get(notebookId);
                group.notes.push(organizedNote);
                group.totalNotes++;
            }
            else {
                orphanedGroup.notes.push(organizedNote);
                orphanedGroup.totalNotes++;
            }
        }
        // Convert to array and sort
        const result = Array.from(notebookGroups.values())
            .sort((a, b) => (a.notebook?.title || '').localeCompare(b.notebook?.title || ''));
        // Add orphaned notes (Notes with No Notebook) if any exist
        if (orphanedGroup.totalNotes > 0) {
            result.push(orphanedGroup);
        }
        return result;
    }
    /**
     * Get organization statistics
     */
    getOrganizationStats() {
        const notes = this.database.getActiveNotes();
        const notebooks = this.database.getActiveNotebooks();
        const references = this.database.getBibleReferences();
        const notesWithContent = notes.filter((n) => n.contentRichText && n.contentRichText.trim() !== '').length;
        const noteIdsWithReferences = new Set(references.map((r) => r.noteId));
        const notesWithReferences = notes.filter((n) => noteIdsWithReferences.has(n.id)).length;
        const notebookIds = new Set(notebooks.map((nb) => nb.externalId));
        const orphanedNotes = notes.filter((n) => !notebookIds.has(n.notebookExternalId)).length;
        return {
            totalNotes: notes.length,
            notesWithContent,
            notesWithReferences,
            notebooks: notebooks.length,
            orphanedNotes
        };
    }
    /**
     * Get notes by notebook ID (filtered from all notes)
     */
    getNotesByNotebook(notebookExternalId) {
        const allNotes = this.database.getActiveNotes();
        let notes = allNotes.filter((n) => n.notebookExternalId === notebookExternalId);
        // Filter out highlights if requested
        if (this.options.skipHighlights) {
            notes = notes.filter((note) => note.kind !== 1); // 1 = highlight
        }
        const notebooks = this.database.getActiveNotebooks();
        const allReferences = this.database.getBibleReferences();
        const allTextRanges = this.database.getNoteAnchorTextRanges();
        const notebookMap = new Map();
        notebooks.forEach((nb) => notebookMap.set(nb.externalId, nb));
        const referencesMap = new Map();
        allReferences.forEach((ref) => {
            const decoded = this.referenceDecoder.decodeReference(ref.reference, ref.bibleBook);
            if (decoded) {
                if (!referencesMap.has(ref.noteId)) {
                    referencesMap.set(ref.noteId, []);
                }
                referencesMap.get(ref.noteId).push(decoded);
            }
        });
        const textRangesMap = new Map();
        allTextRanges.forEach((range) => {
            if (!textRangesMap.has(range.noteId)) {
                textRangesMap.set(range.noteId, range);
            }
        });
        return notes.map((note) => this.processNote(note, notebookMap, referencesMap, textRangesMap));
    }
    /**
     * Generate a safe filename for a note
     */
    generateNoteFilename(note, index) {
        let filename = '';
        // Prefer title from rich content or use references
        if (note.formattedTitle) {
            filename = note.formattedTitle;
        }
        else if (note.references.length > 0) {
            filename = note.references[0].formatted;
        }
        else {
            filename = `Note-${note.id}`;
        }
        // Add index if needed to ensure uniqueness
        if (index > 1) {
            filename += `-${index}`;
        }
        return this.sanitizeFilename(filename) + '.md';
    }
    /**
     * Process a single note with notebook and reference information
     */
    processNote(note, notebookMap, referencesMap, textRangesMap) {
        const notebook = notebookMap.get(note.notebookExternalId) || null;
        const references = referencesMap.get(note.id) || [];
        const anchorTextRange = textRangesMap.get(note.id);
        // Generate formatted title
        const formattedTitle = this.generateNoteTitle(note, references);
        // Create sanitized filename
        const sanitizedFilename = this.sanitizeFilename(formattedTitle);
        return {
            ...note,
            notebook,
            references,
            formattedTitle,
            sanitizedFilename,
            anchorTextRange
        };
    }
    /**
     * Generate a human-readable title for a note
     */
    generateNoteTitle(note, references) {
        // Try to extract title from rich text content
        if (note.contentRichText) {
            const title = this.extractTitleFromContent(note.contentRichText);
            if (title)
                return title;
        }
        // Use primary reference as title
        if (references.length > 0) {
            return references[0].formatted;
        }
        // Fallback to note type and ID
        const noteType = note.kind === 0 ? 'Note' : note.kind === 1 ? 'Highlight' : 'Annotation';
        return `${noteType} ${note.id}`;
    }
    /**
     * Extract title from rich text content (first meaningful line)
     */
    extractTitleFromContent(content) {
        // Remove Rich Text (XAML) tags and extract first meaningful text
        const cleanText = content
            .replace(/<[^>]+>/g, ' ') // Remove XML/XAML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        if (!cleanText)
            return null;
        // Get first line or first 50 characters
        const firstLine = cleanText.split(/[\\n\\r]/)[0].trim();
        if (firstLine.length > 50) {
            return firstLine.substring(0, 47) + '...';
        }
        return firstLine || null;
    }
    /**
     * Sanitize a string for use as a filename or folder name
     */
    sanitizeFilename(name) {
        return name
            .replace(/[<>:\"/\\|?*]/g, '-') // Replace invalid file characters
            .replace(/\\s+/g, '-') // Replace spaces with dashes
            .replace(/-+/g, '-') // Collapse multiple dashes
            .replace(/^-|-$/g, '') // Remove leading/trailing dashes
            .substring(0, 100) // Limit length
            || 'untitled';
    }
    /**
     * Close database connection
     */
    close() {
        this.database.close();
    }
}
