import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

export interface NoteRecord {
  Id: number;
  NotesDocumentId: number;
  CompressedUserTitle: string | null;
  CompressedContent: string;
  Rank: number;
  Level: number;
  Color: number | null;
  MarkupKind: number;
  MarkupStyleName: string | null;
  Tags: string | null;
  IndicatorKind: number;
  Created: string;
  Modified: string;
  SyncId: string;
  Revision: string;
  ImportId: string | null;
  IsSubmitted: number;
  Extra: string | null;
}

export interface ExportOptions {
  fromId?: number;
  toId?: number;
  outputPath?: string;
}

export class NotesDatabase {
  private db: Database;

  constructor(dbPath: string) {
    if (!existsSync(dbPath)) {
      throw new Error(`Database file not found: ${dbPath}`);
    }
    
    this.db = new Database(dbPath, { readonly: true });
  }

  /**
   * Get all notes or notes within a specific ID range
   */
  public getNotes(options: ExportOptions = {}): NoteRecord[] {
    let query = `
      SELECT 
        Id,
        NotesDocumentId,
        CompressedUserTitle,
        CompressedContent,
        Rank,
        Level,
        Color,
        MarkupKind,
        MarkupStyleName,
        Tags,
        IndicatorKind,
        Created,
        Modified,
        SyncId,
        Revision,
        ImportId,
        IsSubmitted,
        Extra
      FROM Notes
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (options.fromId !== undefined) {
      conditions.push('Id >= ?');
      params.push(options.fromId);
    }

    if (options.toId !== undefined) {
      conditions.push('Id <= ?');
      params.push(options.toId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY Id';

    const stmt = this.db.query(query);
    const rows = stmt.all(...params);

    // Convert BLOB fields to base64 strings (similar to Python export)
    return rows.map((row: any) => ({
      ...row,
      CompressedUserTitle: row.CompressedUserTitle ? Buffer.from(row.CompressedUserTitle).toString('base64') : null,
      CompressedContent: row.CompressedContent ? Buffer.from(row.CompressedContent).toString('base64') : '',
      SyncId: row.SyncId ? Buffer.from(row.SyncId).toString('base64') : '',
      Revision: row.Revision ? Buffer.from(row.Revision).toString('base64') : '',
      Extra: row.Extra ? Buffer.from(row.Extra).toString('base64') : null,
    })) as NoteRecord[];
  }

  /**
   * Get table statistics
   */
  public getStats(): { totalNotes: number; minId: number; maxId: number } {
    const stmt = this.db.query('SELECT COUNT(*) as total, MIN(Id) as minId, MAX(Id) as maxId FROM Notes');
    const result = stmt.get() as any;
    
    return {
      totalNotes: result.total,
      minId: result.minId,
      maxId: result.maxId
    };
  }

  /**
   * Export notes to JSON file
   */
  public async exportToJson(options: ExportOptions = {}): Promise<string> {
    const notes = this.getNotes(options);
    const stats = this.getStats();
    
    // Determine output path
    const outputPath = options.outputPath || path.join('data', 'NotesTable.json');
    
    // Ensure data directory exists
    const dir = path.dirname(outputPath);
    await Bun.write(path.join(dir, '.gitkeep'), ''); // This will create the directory if it doesn't exist
    
    // Write JSON file with pretty formatting
    const jsonContent = JSON.stringify(notes, null, 4);
    await writeFile(outputPath, jsonContent, 'utf8');
    
    const rangeInfo = options.fromId || options.toId 
      ? ` (ID range: ${options.fromId || stats.minId}-${options.toId || stats.maxId})`
      : '';
    
    return `Exported ${notes.length} notes${rangeInfo} to ${outputPath}`;
  }

  /**
   * Close database connection
   */
  public close(): void {
    this.db.close();
  }
} 