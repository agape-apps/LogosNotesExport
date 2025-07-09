import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';

export interface NoteWithReference {
  id: number;
  content: string | null;
  title: string | null;
  created: string;
  markupStyle: string | null;
  references: ScriptureReference[];
  approach: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ScriptureReference {
  reference: string;
  bibleBook: number;
  noteId: number;
  anchorIndex: number;
}

export class ReferenceAssociator {
  private notesDb: Database;
  private notestoolDb: Database;

  constructor(
    notesDbPath = 'LogosDocuments/Documents/Notes/notes.db',
    notestoolDbPath = 'LogosDocuments/NotesToolManager/notestool.db'
  ) {
    if (!existsSync(notesDbPath)) {
      throw new Error(`Notes database not found: ${notesDbPath}`);
    }
    if (!existsSync(notestoolDbPath)) {
      throw new Error(`NotesTool database not found: ${notestoolDbPath}`);
    }

    this.notesDb = new Database(notesDbPath, { readonly: true });
    this.notestoolDb = new Database(notestoolDbPath, { readonly: true });
  }

  /**
   * Approach 1: Direct ID matching
   */
  getNotesWithReferencesDirectId(limit: number = 10): NoteWithReference[] {
    const query = `
      SELECT 
        n.Id as id,
        n.CompressedUserTitle as title,
        n.CompressedContent as content,
        n.Created as created,
        n.MarkupStyleName as markupStyle
      FROM Notes n
      WHERE n.Id <= ?
      ORDER BY n.Id
      LIMIT ?
    `;

    const notes = this.notesDb.query(query).all(1048, limit) as any[];
    
    return notes.map(note => {
      const references = this.getReferencesForNoteId(note.id);
      return {
        id: note.id,
        content: note.content ? this.decodeBase64(note.content) : null,
        title: note.title ? this.decodeBase64(note.title) : null,
        created: note.created,
        markupStyle: note.markupStyle,
        references,
        approach: 'direct_id',
        confidence: references.length > 0 ? 'medium' : 'low'
      };
    });
  }

  /**
   * Approach 2: SyncId/ExternalId matching
   */
  getNotesWithReferencesSyncId(limit: number = 10): NoteWithReference[] {
    // First get notes from notes.db
    const notesQuery = `
      SELECT 
        Id as id,
        CompressedUserTitle as title,
        CompressedContent as content,
        Created as created,
        MarkupStyleName as markupStyle,
        SyncId as syncId
      FROM Notes
      ORDER BY Id
      LIMIT ?
    `;

    const notes = this.notesDb.query(notesQuery).all(limit) as any[];
    
    return notes.map(note => {
      // Convert SyncId to hex string for matching
      const syncIdHex = this.binaryToHex(note.syncId);
      const references = this.getReferencesForSyncId(syncIdHex);
      
      return {
        id: note.id,
        content: note.content ? this.decodeBase64(note.content) : null,
        title: note.title ? this.decodeBase64(note.title) : null,
        created: note.created,
        markupStyle: note.markupStyle,
        references,
        approach: 'sync_id',
        confidence: references.length > 0 ? 'high' : 'low'
      };
    });
  }

  /**
   * Approach 3: Timestamp-based correlation
   */
  getNotesWithReferencesTimestamp(limit: number = 10): NoteWithReference[] {
    const query = `
      SELECT 
        n.Id as id,
        n.CompressedUserTitle as title,
        n.CompressedContent as content,
        n.Created as created,
        n.MarkupStyleName as markupStyle
      FROM Notes n
      ORDER BY n.Id
      LIMIT ?
    `;

    const notes = this.notesDb.query(query).all(limit) as any[];
    
    return notes.map(note => {
      const references = this.getReferencesForTimestamp(note.created);
      return {
        id: note.id,
        content: note.content ? this.decodeBase64(note.content) : null,
        title: note.title ? this.decodeBase64(note.title) : null,
        created: note.created,
        markupStyle: note.markupStyle,
        references,
        approach: 'timestamp',
        confidence: references.length > 0 ? 'low' : 'low'
      };
    });
  }

  /**
   * Get references for a specific note ID (Approach 1)
   */
  private getReferencesForNoteId(noteId: number): ScriptureReference[] {
    const query = `
      SELECT Reference as reference, BibleBook as bibleBook, NoteId as noteId, AnchorIndex as anchorIndex
      FROM NoteAnchorFacetReferences
      WHERE NoteId = ?
    `;
    return this.notestoolDb.query(query).all(noteId) as ScriptureReference[];
  }

  /**
   * Get references using SyncId matching (Approach 2)
   */
  private getReferencesForSyncId(syncIdHex: string): ScriptureReference[] {
    // Find the matching note in notestool.db using ExternalId
    const noteQuery = `
      SELECT NoteId 
      FROM Notes 
      WHERE REPLACE(LOWER(ExternalId), '-', '') = LOWER(?)
    `;
    
    const matchingNote = this.notestoolDb.query(noteQuery).get(syncIdHex) as any;
    
    if (!matchingNote) {
      return [];
    }

    return this.getReferencesForNoteId(matchingNote.NoteId);
  }

  /**
   * Get references using timestamp matching (Approach 3)
   */
  private getReferencesForTimestamp(created: string): ScriptureReference[] {
    // Find notes created within 1 hour of the target timestamp
    const noteQuery = `
      SELECT NoteId, CreatedDate,
             ABS(strftime('%s', ?) - strftime('%s', CreatedDate)) as time_diff
      FROM Notes 
      WHERE time_diff < 3600
      ORDER BY time_diff
      LIMIT 1
    `;
    
    const matchingNote = this.notestoolDb.query(noteQuery).get(created) as any;
    
    if (!matchingNote) {
      return [];
    }

    return this.getReferencesForNoteId(matchingNote.NoteId);
  }

  /**
   * Compare all three approaches for a set of notes
   */
  compareApproaches(limit: number = 5): {
    directId: NoteWithReference[];
    syncId: NoteWithReference[];
    timestamp: NoteWithReference[];
    summary: any;
  } {
    const directId = this.getNotesWithReferencesDirectId(limit);
    const syncId = this.getNotesWithReferencesSyncId(limit);
    const timestamp = this.getNotesWithReferencesTimestamp(limit);

    const summary = {
      directId: {
        totalNotes: directId.length,
        notesWithReferences: directId.filter(n => n.references.length > 0).length,
        confidence: directId.filter(n => n.confidence === 'high').length
      },
      syncId: {
        totalNotes: syncId.length,
        notesWithReferences: syncId.filter(n => n.references.length > 0).length,
        confidence: syncId.filter(n => n.confidence === 'high').length
      },
      timestamp: {
        totalNotes: timestamp.length,
        notesWithReferences: timestamp.filter(n => n.references.length > 0).length,
        confidence: timestamp.filter(n => n.confidence === 'high').length
      }
    };

    return { directId, syncId, timestamp, summary };
  }

  /**
   * Utility functions
   */
  private decodeBase64(base64: string): string | null {
    try {
      return Buffer.from(base64, 'base64').toString('utf8');
    } catch {
      return null;
    }
  }

  private binaryToHex(binary: any): string {
    if (!binary) return '';
    try {
      return Buffer.from(binary).toString('hex');
    } catch {
      return '';
    }
  }

  close(): void {
    this.notesDb.close();
    this.notestoolDb.close();
  }
}

/**
 * Test script to compare all approaches
 */
export async function testReferenceAssociation(): Promise<void> {
  console.log('🔍 Testing Reference Association Approaches...\n');
  
  const associator = new ReferenceAssociator();
  
  try {
    const results = associator.compareApproaches(10);
    
    console.log('📊 **APPROACH COMPARISON SUMMARY**\n');
    console.log('| Approach | Total Notes | Notes with Refs | High Confidence |');
    console.log('|----------|-------------|-----------------|-----------------|');
    console.log(`| Direct ID | ${results.summary.directId.totalNotes} | ${results.summary.directId.notesWithReferences} | ${results.summary.directId.confidence} |`);
    console.log(`| Sync ID | ${results.summary.syncId.totalNotes} | ${results.summary.syncId.notesWithReferences} | ${results.summary.syncId.confidence} |`);
    console.log(`| Timestamp | ${results.summary.timestamp.totalNotes} | ${results.summary.timestamp.notesWithReferences} | ${results.summary.timestamp.confidence} |`);
    
    console.log('\n🔍 **SAMPLE RESULTS FROM EACH APPROACH**\n');
    
    // Show first result from each approach
    console.log('**Direct ID Approach (First Result):**');
    if (results.directId[0]) {
      const note = results.directId[0];
      console.log(`Note ${note.id}: ${note.references.length} references`);
      note.references.forEach(ref => console.log(`  - ${ref.reference}`));
    }
    
    console.log('\n**Sync ID Approach (First Result):**');
    if (results.syncId[0]) {
      const note = results.syncId[0];
      console.log(`Note ${note.id}: ${note.references.length} references`);
      note.references.forEach(ref => console.log(`  - ${ref.reference}`));
    }
    
    console.log('\n**Timestamp Approach (First Result):**');
    if (results.timestamp[0]) {
      const note = results.timestamp[0];
      console.log(`Note ${note.id}: ${note.references.length} references`);
      note.references.forEach(ref => console.log(`  - ${ref.reference}`));
    }
    
  } finally {
    associator.close();
  }
} 