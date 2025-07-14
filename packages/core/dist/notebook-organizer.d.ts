import { NotesToolDatabase } from './notestool-database.js';
import type { NotesToolNote, Notebook, NoteAnchorTextRange } from './notestool-database.js';
import type { DecodedReference } from './reference-decoder.js';
export interface NotebookOrganizerOptions {
    skipHighlights?: boolean;
}
export interface OrganizedNote extends NotesToolNote {
    references: DecodedReference[];
    notebook: Notebook | null;
    formattedTitle: string;
    sanitizedFilename: string;
    anchorTextRange?: NoteAnchorTextRange;
}
export interface NotebookGroup {
    notebook: Notebook | null;
    notes: OrganizedNote[];
    totalNotes: number;
    sanitizedFolderName: string;
}
export interface OrganizationStats {
    totalNotes: number;
    notesWithContent: number;
    notesWithReferences: number;
    notebooks: number;
    orphanedNotes: number;
}
export declare class NotebookOrganizer {
    private database;
    private referenceDecoder;
    private options;
    constructor(database: NotesToolDatabase, options?: NotebookOrganizerOptions);
    /**
     * Organize all active notes by notebooks with references
     */
    organizeNotes(): Promise<NotebookGroup[]>;
    /**
     * Get organization statistics
     */
    getOrganizationStats(): OrganizationStats;
    /**
     * Get notes by notebook ID (filtered from all notes)
     */
    getNotesByNotebook(notebookExternalId: string): OrganizedNote[];
    /**
     * Generate a safe filename for a note
     */
    generateNoteFilename(note: OrganizedNote, index: number): string;
    /**
     * Process a single note with notebook and reference information
     */
    private processNote;
    /**
     * Generate a human-readable title for a note
     */
    private generateNoteTitle;
    /**
     * Extract title from rich text content (first meaningful line)
     */
    private extractTitleFromContent;
    /**
     * Sanitize a string for use as a filename or folder name
     */
    private sanitizeFilename;
    /**
     * Close database connection
     */
    close(): void;
}
