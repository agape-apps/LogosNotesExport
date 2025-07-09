import { NotesToolDatabase } from './notestool-database.js';
import type { NotesToolNote, Notebook } from './notestool-database.js';
import { BibleReferenceDecoder } from './reference-decoder.js';
import type { DecodedReference } from './reference-decoder.js';

export interface OrganizedNote extends NotesToolNote {
  references: DecodedReference[];
  notebook: Notebook | null;
  formattedTitle: string;
  sanitizedFilename: string;
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

export class NotebookOrganizer {
  private database: NotesToolDatabase;
  private referenceDecoder: BibleReferenceDecoder;

  constructor(database: NotesToolDatabase) {
    this.database = database;
    this.referenceDecoder = new BibleReferenceDecoder();
  }

  /**
   * Organize all active notes by notebooks with references
   */
  public async organizeNotes(): Promise<NotebookGroup[]> {
    const notes = this.database.getActiveNotes();
    const notebooks = this.database.getActiveNotebooks();
    const allReferences = this.database.getBibleReferences();

    // Create a map for quick notebook lookup
    const notebookMap = new Map<string, Notebook>();
    notebooks.forEach((nb: Notebook) => notebookMap.set(nb.externalId, nb));

    // Create a map for quick reference lookup
    const referencesMap = new Map<number, DecodedReference[]>();
    allReferences.forEach((ref: any) => {
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

    // Process notes and organize by notebook
    const notebookGroups = new Map<string, NotebookGroup>();
    const orphanedGroup: NotebookGroup = {
      notebook: null,
      notes: [],
      totalNotes: 0,
      sanitizedFolderName: 'orphaned-notes'
    };

    for (const note of notes) {
      const organizedNote = this.processNote(note, notebookMap, referencesMap);
      
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
        
        const group = notebookGroups.get(notebookId)!;
        group.notes.push(organizedNote);
        group.totalNotes++;
      } else {
        orphanedGroup.notes.push(organizedNote);
        orphanedGroup.totalNotes++;
      }
    }

    // Convert to array and sort
    const result = Array.from(notebookGroups.values())
      .sort((a, b) => (a.notebook?.title || '').localeCompare(b.notebook?.title || ''));

    // Add orphaned notes if any exist
    if (orphanedGroup.totalNotes > 0) {
      result.push(orphanedGroup);
    }

    return result;
  }

  /**
   * Get organization statistics
   */
  public getOrganizationStats(): OrganizationStats {
    const notes = this.database.getActiveNotes();
    const notebooks = this.database.getActiveNotebooks();
    const references = this.database.getBibleReferences();

    const notesWithContent = notes.filter((n: NotesToolNote) => 
      n.contentRichText && n.contentRichText.trim() !== ''
    ).length;

    const noteIdsWithReferences = new Set(references.map((r: any) => r.noteId));
    const notesWithReferences = notes.filter((n: NotesToolNote) => noteIdsWithReferences.has(n.id)).length;

    const notebookIds = new Set(notebooks.map((nb: Notebook) => nb.externalId));
    const orphanedNotes = notes.filter((n: NotesToolNote) => !notebookIds.has(n.notebookExternalId)).length;

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
  public getNotesByNotebook(notebookExternalId: string): OrganizedNote[] {
    const allNotes = this.database.getActiveNotes();
    const notes = allNotes.filter((n: any) => n.notebookExternalId === notebookExternalId);
    const notebooks = this.database.getActiveNotebooks();
    const allReferences = this.database.getBibleReferences();

    const notebookMap = new Map<string, Notebook>();
    notebooks.forEach((nb: any) => notebookMap.set(nb.externalId, nb));

    const referencesMap = new Map<number, DecodedReference[]>();
    allReferences.forEach((ref: any) => {
      const decoded = this.referenceDecoder.decodeReference(ref.reference, ref.bibleBook);
      if (decoded) {
        if (!referencesMap.has(ref.noteId)) {
          referencesMap.set(ref.noteId, []);
        }
        referencesMap.get(ref.noteId)!.push(decoded);
      }
    });

    return notes.map((note: any) => this.processNote(note, notebookMap, referencesMap));
  }

  /**
   * Generate a safe filename for a note
   */
  public generateNoteFilename(note: OrganizedNote, index: number): string {
    let filename = '';

    // Prefer title from rich content or use references
    if (note.formattedTitle) {
      filename = note.formattedTitle;
    } else if (note.references.length > 0) {
      filename = note.references[0].formatted;
    } else {
      filename = `note-${note.id}`;
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
  private processNote(
    note: NotesToolNote, 
    notebookMap: Map<string, Notebook>,
    referencesMap: Map<number, DecodedReference[]>
  ): OrganizedNote {
    const notebook = notebookMap.get(note.notebookExternalId) || null;
    const references = referencesMap.get(note.id) || [];
    
    // Generate formatted title
    const formattedTitle = this.generateNoteTitle(note, references);
    
    // Create sanitized filename
    const sanitizedFilename = this.sanitizeFilename(formattedTitle);

    return {
      ...note,
      notebook,
      references,
      formattedTitle,
      sanitizedFilename
    };
  }

  /**
   * Generate a human-readable title for a note
   */
  private generateNoteTitle(note: NotesToolNote, references: DecodedReference[]): string {
    // Try to extract title from rich text content
    if (note.contentRichText) {
      const title = this.extractTitleFromContent(note.contentRichText);
      if (title) return title;
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
  private extractTitleFromContent(content: string): string | null {
    // Remove XAML tags and extract first meaningful text
    const cleanText = content
      .replace(/<[^>]+>/g, ' ') // Remove XML/XAML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanText) return null;

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
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[<>:\"/\\|?*]/g, '-') // Replace invalid file characters
      .replace(/\\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase()
      .substring(0, 100) // Limit length
      || 'untitled';
  }

  /**
   * Close database connection
   */
  public close(): void {
    this.database.close();
  }
} 