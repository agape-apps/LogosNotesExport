import { NotesDatabase } from './database.js';
import { existsSync } from 'fs';

/**
 * Debug utility to check what's actually in the database for specific notes
 */
export async function debugDatabaseContent(
  databasePath: string = 'LogosDocuments/Documents/Notes/notes.db',
  noteIds: number[] = [10, 11, 44, 50, 82]
): Promise<void> {
  
  if (!existsSync(databasePath)) {
    throw new Error(`Database file not found: ${databasePath}`);
  }
  
  const db = new NotesDatabase(databasePath);
  
  console.log(`🔍 Checking database content for ${noteIds.length} notes...`);
  console.log(`📂 Database: ${databasePath}`);
  console.log();
  
  for (const noteId of noteIds) {
    console.log(`🔍 Note ${noteId}:`);
    
    try {
      // Get the specific note
      const notes = db.getNotes({ fromId: noteId, toId: noteId });
      
      if (notes.length === 0) {
        console.log(`   ❌ NOT FOUND in database`);
      } else {
        const note = notes[0];
        if (note) {
          console.log(`   📝 MarkupStyle: ${note.MarkupStyleName || 'None'}`);
          console.log(`   📂 CompressedContent: ${note.CompressedContent ? 'Present' : 'Missing'} (length: ${note.CompressedContent?.length || 0})`);
          console.log(`   📂 CompressedUserTitle: ${note.CompressedUserTitle ? 'Present' : 'Missing'} (length: ${note.CompressedUserTitle?.length || 0})`);
          
          if (note.CompressedContent) {
            console.log(`   📄 CompressedContent first 50 chars: "${note.CompressedContent.substring(0, 50)}..."`);
          }
          
          if (note.CompressedUserTitle) {
            console.log(`   📄 CompressedUserTitle first 50 chars: "${note.CompressedUserTitle.substring(0, 50)}..."`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ DATABASE ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log();
  }
  
  db.close();
} 