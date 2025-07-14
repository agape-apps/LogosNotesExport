import { type DatabaseLocation } from './database-locator.js';
export interface NotesToolNote {
    id: number;
    externalId: string;
    createdDate: string;
    modifiedDate?: string;
    kind: number;
    contentRichText?: string;
    anchorBibleBook?: number;
    notebookExternalId: string;
    noteStyleId?: number;
    noteColorId?: number;
    noteIndicatorId?: number;
    anchorDataTypeId?: number;
    anchorResourceIdId?: number;
    isDeleted: boolean;
    isTrashed: boolean;
}
export interface BibleReference {
    noteId: number;
    reference: string;
    bibleBook?: number;
    anchorIndex: number;
    dataTypeId: number;
}
export interface Notebook {
    notebookId: number;
    externalId: string;
    title?: string;
    createdDate: string;
    isDeleted: boolean;
    isTrashed: boolean;
}
export interface NoteStyle {
    noteStyleId: number;
    name: string;
}
export interface NoteColor {
    noteColorId: number;
    name: string;
}
export interface DataType {
    dataTypeId: number;
    name: string;
}
export interface NoteIndicator {
    noteIndicatorId: number;
    name: string;
}
export interface ResourceId {
    resourceIdId: number;
    resourceId: string;
}
export interface NoteAnchorTextRange {
    noteId: number;
    anchorIndex: number;
    resourceIdId: number;
    resourceVersionId: number;
    offset: number;
    pastEnd: number;
    wordNumberCount: number;
}
export declare class NotesToolDatabase {
    private db;
    private dbLocation;
    constructor(dbPath?: string);
    /**
     * Find the best database location
     */
    private findDatabase;
    /**
     * Get information about the database being used
     */
    getDatabaseInfo(): DatabaseLocation;
    /**
     * Display all available database locations
     */
    static displayAvailableLocations(): string[];
    /**
     * Get manual search instructions for finding the database
     */
    static getSearchInstructions(): string[];
    /**
     * Get all active notes (not deleted or trashed)
     */
    getActiveNotes(): NotesToolNote[];
    /**
     * Get all Bible references for notes
     */
    getBibleReferences(noteIds?: number[]): BibleReference[];
    /**
     * Get all active notebooks
     */
    getActiveNotebooks(): Notebook[];
    /**
     * Get notebook by external ID
     */
    getNotebook(externalId: string): Notebook | null;
    /**
     * Get all note styles
     */
    getNoteStyles(): NoteStyle[];
    /**
     * Get all note colors
     */
    getNoteColors(): NoteColor[];
    /**
     * Get all data types (Bible versions)
     */
    getDataTypes(): DataType[];
    /**
     * Get all note indicators
     */
    getNoteIndicators(): NoteIndicator[];
    /**
     * Get all resource IDs
     */
    getResourceIds(): ResourceId[];
    /**
     * Get all note anchor text ranges for offset data
     */
    getNoteAnchorTextRanges(noteIds?: number[]): NoteAnchorTextRange[];
    /**
     * Get complete note data with references and metadata
     */
    getNotesWithReferences(): Array<NotesToolNote & {
        references: BibleReference[];
        notebook?: Notebook;
        style?: NoteStyle;
        color?: NoteColor;
        indicator?: NoteIndicator;
        dataType?: DataType;
        resourceId?: ResourceId;
    }>;
    /**
     * Get database statistics
     */
    getStats(): {
        totalNotes: number;
        activeNotes: number;
        deletedNotes: number;
        trashedNotes: number;
        notesWithContent: number;
        notesWithReferences: number;
        totalNotebooks: number;
        activeNotebooks: number;
    };
    /**
     * Close database connection
     */
    close(): void;
}
