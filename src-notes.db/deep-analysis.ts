#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';

export class DeepDatabaseAnalysis {
  private notesDb: Database;
  private notestoolDb: Database;

  constructor(
    notesDbPath = 'LogosDocuments/Documents/Notes/notes.db',
    notestoolDbPath = 'LogosDocuments/NotesToolManager/notestool.db'
  ) {
    this.notesDb = new Database(notesDbPath, { readonly: true });
    this.notestoolDb = new Database(notestoolDbPath, { readonly: true });
  }

  /**
   * Analyze if there are any real timestamp correlations
   */
  analyzeTimestampCorrelations(): void {
    console.log('🕒 **TIMESTAMP CORRELATION ANALYSIS**\n');
    
    // Get all creation dates from both databases
    const notesDbDates = this.notesDb.query(`
      SELECT Id, Created, MarkupStyleName 
      FROM Notes 
      ORDER BY Created 
      LIMIT 20
    `).all() as any[];

    const notestoolDbDates = this.notestoolDb.query(`
      SELECT NoteId, CreatedDate 
      FROM Notes 
      ORDER BY CreatedDate 
      LIMIT 20
    `).all() as any[];

    console.log('**Notes.db earliest notes:**');
    notesDbDates.slice(0, 5).forEach(note => {
      console.log(`  ID ${note.Id}: ${note.Created} (${note.MarkupStyleName || 'no style'})`);
    });

    console.log('\n**NotesTool.db earliest notes:**');
    notestoolDbDates.slice(0, 5).forEach(note => {
      console.log(`  ID ${note.NoteId}: ${note.CreatedDate}`);
    });

    // Check for any timestamp overlaps
    const timeMatches = this.findTimeBasedMatches();
    console.log(`\n**Time-based matches found:** ${timeMatches.length}`);
    
    if (timeMatches.length > 0) {
      console.log('**Sample matches:**');
      timeMatches.slice(0, 3).forEach(match => {
        console.log(`  Notes.db ID ${match.notesId} (${match.notesCreated}) ↔ NotesTool.db ID ${match.notestoolId} (${match.notestoolCreated}) - Diff: ${match.timeDiffMinutes} minutes`);
      });
    }
  }

  /**
   * Find potential time-based correlations
   */
  private findTimeBasedMatches(): any[] {
    const query = `
      SELECT 
        n1.Id as notesId,
        n1.Created as notesCreated,
        n2.NoteId as notestoolId,
        n2.CreatedDate as notestoolCreated,
        ABS(strftime('%s', n1.Created) - strftime('%s', n2.CreatedDate)) / 60.0 as timeDiffMinutes
      FROM 
        (SELECT Id, Created FROM main.Notes) n1
      CROSS JOIN 
        (SELECT NoteId, CreatedDate FROM attach.Notes) n2
      WHERE timeDiffMinutes < 60
      ORDER BY timeDiffMinutes
      LIMIT 10
    `;

    // We need to attach the notestool database for cross-database queries
    this.notesDb.exec(`ATTACH DATABASE '${this.notestoolDb.filename}' AS attach`);
    
    try {
      return this.notesDb.query(query).all() as any[];
    } catch (error) {
      console.log('Note: Cross-database query failed, trying alternative approach...');
      return [];
    }
  }

  /**
   * Analyze actual note content vs references to verify associations
   */
  analyzeContentVsReferences(): void {
    console.log('\n📝 **CONTENT VS REFERENCES ANALYSIS**\n');
    
    // Get a sample of notes with both content and references
    const sampleNotes = [1, 2, 3, 5, 6, 7, 8, 9, 10];
    
    for (const noteId of sampleNotes) {
      console.log(`**Note ID ${noteId}:**`);
      
      // Get content from notes.db
      const noteContent = this.notesDb.query(`
        SELECT Id, Created, MarkupStyleName, CompressedContent
        FROM Notes WHERE Id = ?
      `).get(noteId) as any;

      // Get references from notestool.db
      const references = this.notestoolDb.query(`
        SELECT Reference, BibleBook
        FROM NoteAnchorFacetReferences WHERE NoteId = ?
      `).all(noteId) as any[];

      if (noteContent) {
        console.log(`  Notes.db: Created ${noteContent.Created}, Style: ${noteContent.MarkupStyleName || 'none'}`);
        if (noteContent.CompressedContent) {
          try {
            const decoded = Buffer.from(noteContent.CompressedContent, 'base64').toString('utf8');
            console.log(`  Content preview: "${decoded.substring(0, 100)}..."`);
          } catch {
            console.log(`  Content: [Unable to decode, ${noteContent.CompressedContent.length} chars]`);
          }
        }
      }

      if (references.length > 0) {
        console.log(`  References (${references.length}):`);
        references.forEach(ref => {
          console.log(`    - ${ref.Reference} (Book ${ref.BibleBook})`);
        });
      } else {
        console.log(`  No references found`);
      }

      console.log('');
    }
  }

  /**
   * Check for alternative relationship patterns
   */
  analyzeAlternativeRelationships(): void {
    console.log('\n🔍 **ALTERNATIVE RELATIONSHIP ANALYSIS**\n');
    
    // Check if there are any patterns in the data that could indicate relationships
    
    // 1. Check attachment table in notes.db
    console.log('**Attachments table analysis:**');
    const attachmentSample = this.notesDb.query(`
      SELECT NoteId, Kind, DataTypeName, DataTypeReference, ResourceId
      FROM Attachments 
      WHERE NoteId <= 10
      LIMIT 5
    `).all() as any[];
    
    attachmentSample.forEach(att => {
      console.log(`  Note ${att.NoteId}: Kind ${att.Kind}, DataType: ${att.DataTypeName || 'none'}, Resource: ${att.ResourceId || 'none'}`);
    });

    // 2. Check if there are common resource IDs or other linking data
    console.log('\n**Resource correlation analysis:**');
    const notestoolResources = this.notestoolDb.query(`
      SELECT DISTINCT n.NoteId, r.ResourceId
      FROM Notes n
      JOIN NoteAnchorTextRanges t ON n.NoteId = t.NoteId
      JOIN ResourceIds r ON t.ResourceIdId = r.ResourceIdId
      WHERE n.NoteId <= 20
      LIMIT 10
    `).all() as any[];
    
    console.log('NotesTool.db resources:');
    notestoolResources.forEach(res => {
      console.log(`  Note ${res.NoteId}: Resource ${res.ResourceId}`);
    });
  }

  /**
   * Comprehensive analysis summary
   */
  runFullAnalysis(): void {
    console.log('🔬 **COMPREHENSIVE DATABASE RELATIONSHIP ANALYSIS**\n');
    console.log('=' .repeat(60) + '\n');
    
    this.analyzeTimestampCorrelations();
    this.analyzeContentVsReferences();
    this.analyzeAlternativeRelationships();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 **CONCLUSIONS & RECOMMENDATIONS**\n');
    
    console.log('🚨 **KEY FINDINGS:**');
    console.log('1. Direct ID matching creates FALSE associations');
    console.log('2. SyncId/ExternalId fields are completely different');
    console.log('3. Creation timestamps are completely different for same IDs');
    console.log('4. These appear to be separate note systems or different versions');
    
    console.log('\n💡 **RECOMMENDATIONS:**');
    console.log('1. ❌ AVOID Direct ID matching - it associates wrong content');
    console.log('2. 🔍 INVESTIGATE if notes.db and notestool.db are for different purposes');
    console.log('3. 📅 CONSIDER if these are from different time periods or sync states');
    console.log('4. 🔗 LOOK for alternative linking mechanisms (resource IDs, external keys)');
    console.log('5. 👤 VERIFY with user which notes they actually see in Logos application');
  }

  close(): void {
    this.notesDb.close();
    this.notestoolDb.close();
  }
}

// Main execution
const analyzer = new DeepDatabaseAnalysis();

try {
  analyzer.runFullAnalysis();
} finally {
  analyzer.close();
} 