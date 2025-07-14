import { Database } from 'bun:sqlite';
import { DatabaseLocator } from './database-locator.js';
export class NotesToolDatabase {
    constructor(dbPath) {
        this.dbLocation = this.findDatabase(dbPath);
        // Validate the database before opening
        const validation = DatabaseLocator.validateDatabase(this.dbLocation.path);
        if (!validation.valid) {
            throw new Error(`Invalid database: ${validation.error}`);
        }
        // Open database in READ-ONLY mode for safety
        this.db = new Database(this.dbLocation.path, { readonly: true });
    }
    /**
     * Find the best database location
     */
    findDatabase(customPath) {
        // 1. If custom path provided, use it
        if (customPath) {
            const customLocation = DatabaseLocator.checkCustomPath(customPath);
            if (!customLocation) {
                throw new Error(`Invalid custom database path: ${customPath}`);
            }
            if (!customLocation.exists) {
                throw new Error(`Database file not found at custom path: ${customPath}`);
            }
            return customLocation;
        }
        // 2. Search for database in standard locations
        const bestLocation = DatabaseLocator.getBestDatabase();
        if (!bestLocation) {
            const locations = DatabaseLocator.displayLocations();
            const instructions = DatabaseLocator.getSearchInstructions();
            throw new Error(`No Logos NotesTool database found in standard locations.\n\n` +
                locations.join('\n') + '\n\n' +
                instructions.join('\n'));
        }
        return bestLocation;
    }
    /**
     * Get information about the database being used
     */
    getDatabaseInfo() {
        return { ...this.dbLocation };
    }
    /**
     * Display all available database locations
     */
    static displayAvailableLocations() {
        return DatabaseLocator.displayLocations();
    }
    /**
     * Get manual search instructions for finding the database
     */
    static getSearchInstructions() {
        return DatabaseLocator.getSearchInstructions();
    }
    /**
     * Get all active notes (not deleted or trashed)
     */
    getActiveNotes() {
        const query = `
      SELECT 
        NoteId as id,
        ExternalId as externalId,
        CreatedDate as createdDate,
        ModifiedDate as modifiedDate,
        Kind as kind,
        ContentRichText as contentRichText,
        AnchorBibleBook as anchorBibleBook,
        NotebookExternalId as notebookExternalId,
        NoteStyleId as noteStyleId,
        NoteColorId as noteColorId,
        NoteIndicatorId as noteIndicatorId,
        AnchorDataTypeId as anchorDataTypeId,
        AnchorResourceIdId as anchorResourceIdId,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notes
      WHERE IsDeleted = 0 AND IsTrashed = 0
      ORDER BY CreatedDate, NoteId
    `;
        return this.db.query(query).all();
    }
    /**
     * Get all Bible references for notes
     */
    getBibleReferences(noteIds) {
        let query = `
      SELECT 
        NoteId as noteId,
        Reference as reference,
        BibleBook as bibleBook,
        AnchorIndex as anchorIndex,
        DataTypeId as dataTypeId
      FROM NoteAnchorFacetReferences
    `;
        if (noteIds && noteIds.length > 0) {
            const placeholders = noteIds.map(() => '?').join(',');
            query += ` WHERE NoteId IN (${placeholders})`;
            return this.db.query(query).all(...noteIds);
        }
        query += ` ORDER BY NoteId, AnchorIndex`;
        return this.db.query(query).all();
    }
    /**
     * Get all active notebooks
     */
    getActiveNotebooks() {
        const query = `
      SELECT 
        NotebookId as notebookId,
        ExternalId as externalId,
        Title as title,
        CreatedDate as createdDate,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notebooks
      WHERE IsDeleted = 0 AND IsTrashed = 0
      ORDER BY Title
    `;
        return this.db.query(query).all();
    }
    /**
     * Get notebook by external ID
     */
    getNotebook(externalId) {
        const query = `
      SELECT 
        NotebookId as notebookId,
        ExternalId as externalId,
        Title as title,
        CreatedDate as createdDate,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notebooks
      WHERE ExternalId = ? AND IsDeleted = 0 AND IsTrashed = 0
    `;
        return this.db.query(query).get(externalId);
    }
    /**
     * Get all note styles
     */
    getNoteStyles() {
        const query = `
      SELECT 
        NoteStyleId as noteStyleId,
        Name as name
      FROM NoteStyles
      ORDER BY NoteStyleId
    `;
        return this.db.query(query).all();
    }
    /**
     * Get all note colors
     */
    getNoteColors() {
        const query = `
      SELECT 
        NoteColorId as noteColorId,
        Name as name
      FROM NoteColors
      ORDER BY NoteColorId
    `;
        return this.db.query(query).all();
    }
    /**
     * Get all data types (Bible versions)
     */
    getDataTypes() {
        const query = `
      SELECT 
        DataTypeId as dataTypeId,
        Name as name
      FROM DataTypes
      ORDER BY DataTypeId
    `;
        return this.db.query(query).all();
    }
    /**
     * Get all note indicators
     */
    getNoteIndicators() {
        const query = `
      SELECT 
        NoteIndicatorId as noteIndicatorId,
        Name as name
      FROM NoteIndicators
      ORDER BY NoteIndicatorId
    `;
        return this.db.query(query).all();
    }
    /**
     * Get all resource IDs
     */
    getResourceIds() {
        const query = `
      SELECT 
        ResourceIdId as resourceIdId,
        ResourceId as resourceId
      FROM ResourceIds
      ORDER BY ResourceIdId
    `;
        return this.db.query(query).all();
    }
    /**
     * Get all note anchor text ranges for offset data
     */
    getNoteAnchorTextRanges(noteIds) {
        let query = `
      SELECT 
        NoteId as noteId,
        AnchorIndex as anchorIndex,
        ResourceIdId as resourceIdId,
        ResourceVersionId as resourceVersionId,
        Offset as offset,
        PastEnd as pastEnd,
        WordNumberCount as wordNumberCount
      FROM NoteAnchorTextRanges
    `;
        if (noteIds && noteIds.length > 0) {
            const placeholders = noteIds.map(() => '?').join(',');
            query += ` WHERE NoteId IN (${placeholders})`;
            return this.db.query(query).all(...noteIds);
        }
        query += ` ORDER BY NoteId, AnchorIndex`;
        return this.db.query(query).all();
    }
    /**
     * Get complete note data with references and metadata
     */
    getNotesWithReferences() {
        const notes = this.getActiveNotes();
        const noteIds = notes.map(n => n.id);
        const references = this.getBibleReferences(noteIds);
        const notebooks = this.getActiveNotebooks();
        const styles = this.getNoteStyles();
        const colors = this.getNoteColors();
        const indicators = this.getNoteIndicators();
        const dataTypes = this.getDataTypes();
        const resourceIds = this.getResourceIds();
        // Create lookup maps
        const notebookMap = new Map(notebooks.map(nb => [nb.externalId, nb]));
        const styleMap = new Map(styles.map(s => [s.noteStyleId, s]));
        const colorMap = new Map(colors.map(c => [c.noteColorId, c]));
        const indicatorMap = new Map(indicators.map(i => [i.noteIndicatorId, i]));
        const dataTypeMap = new Map(dataTypes.map(dt => [dt.dataTypeId, dt]));
        const resourceIdMap = new Map(resourceIds.map(r => [r.resourceIdId, r]));
        const referencesMap = new Map();
        // Group references by note ID
        for (const ref of references) {
            if (!referencesMap.has(ref.noteId)) {
                referencesMap.set(ref.noteId, []);
            }
            referencesMap.get(ref.noteId).push(ref);
        }
        // Combine data
        return notes.map(note => ({
            ...note,
            references: referencesMap.get(note.id) || [],
            notebook: notebookMap.get(note.notebookExternalId),
            style: note.noteStyleId ? styleMap.get(note.noteStyleId) : undefined,
            color: note.noteColorId ? colorMap.get(note.noteColorId) : undefined,
            indicator: note.noteIndicatorId ? indicatorMap.get(note.noteIndicatorId) : undefined,
            dataType: note.anchorDataTypeId ? dataTypeMap.get(note.anchorDataTypeId) : undefined,
            resourceId: note.anchorResourceIdId ? resourceIdMap.get(note.anchorResourceIdId) : undefined,
        }));
    }
    /**
     * Get database statistics
     */
    getStats() {
        const statsQuery = `
      SELECT 
        COUNT(*) as totalNotes,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 THEN 1 ELSE 0 END) as activeNotes,
        SUM(CASE WHEN IsDeleted = 1 THEN 1 ELSE 0 END) as deletedNotes,
        SUM(CASE WHEN IsTrashed = 1 THEN 1 ELSE 0 END) as trashedNotes,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 AND ContentRichText IS NOT NULL AND ContentRichText != '' THEN 1 ELSE 0 END) as notesWithContent
      FROM Notes
    `;
        const refStatsQuery = `
      SELECT COUNT(DISTINCT NoteId) as notesWithReferences
      FROM NoteAnchorFacetReferences
    `;
        const notebookStatsQuery = `
      SELECT 
        COUNT(*) as totalNotebooks,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 THEN 1 ELSE 0 END) as activeNotebooks
      FROM Notebooks
    `;
        const noteStats = this.db.query(statsQuery).get();
        const refStats = this.db.query(refStatsQuery).get();
        const notebookStats = this.db.query(notebookStatsQuery).get();
        return {
            ...noteStats,
            ...refStats,
            ...notebookStats,
        };
    }
    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }
}
