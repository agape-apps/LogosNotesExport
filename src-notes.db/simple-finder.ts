// this file was only used for debugging, but is kept here for reference

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { decodeLogosContent } from './decoder.js';
import type { NoteRecord } from './database.js';

/**
 * Simple finder to identify notes in decoded_notes.txt and their actual content
 */
export async function findAllNotesInDecodedFile(
  notesJsonFile: string = 'data/NotesTable.json',
  decodedNotesFile: string = 'data/decoded_notes.txt',
  outputFile: string = 'data/decoded_notes_missing.txt'
): Promise<void> {
  
  if (!existsSync(notesJsonFile)) {
    throw new Error(`Notes JSON file not found: ${notesJsonFile}`);
  }
  
  if (!existsSync(decodedNotesFile)) {
    throw new Error(`Decoded notes file not found: ${decodedNotesFile}`);
  }
  
  // Load all notes
  const allNotes: NoteRecord[] = JSON.parse(await readFile(notesJsonFile, 'utf-8'));
  
  // Parse decoded notes to get all IDs
  const decodedContent = await readFile(decodedNotesFile, 'utf-8');
  const lines = decodedContent.split('\n');
  const decodedNoteIds: number[] = [];
  
  for (const line of lines) {
    const match = line.match(/^### (\d+):/);
    if (match && match[1]) {
      const noteId = parseInt(match[1], 10);
      decodedNoteIds.push(noteId);
    }
  }
  
  console.log(`📂 Total notes in JSON: ${allNotes.length}`);
  console.log(`📄 Notes in decoded_notes.txt: ${decodedNoteIds.length}`);
  
  // Create a lookup map for notes
  const notesMap = new Map<number, NoteRecord>();
  for (const note of allNotes) {
    notesMap.set(note.Id, note);
  }
  
  // Analyze each note in decoded file
  const notesWithoutContent: Array<{id: number, decodedContent: string}> = [];
  let notesWithContent = 0;
  let totalProcessed = 0;
  
  for (const noteId of decodedNoteIds) {
    const note = notesMap.get(noteId);
    totalProcessed++;
    
    if (!note) {
      console.warn(`⚠️ Note ${noteId} in decoded file but not found in JSON`);
      continue;
    }
    
    const hasCompressedContent = !!(note.CompressedContent && note.CompressedContent.trim());
    
    if (hasCompressedContent) {
      notesWithContent++;
    } else {
      // This note is in decoded_notes.txt but has no CompressedContent
      let decodedContent = '';
      try {
        if (note.CompressedContent) {
          decodedContent = decodeLogosContent(note.CompressedContent);
        }
      } catch (error) {
        decodedContent = `[ERROR: ${error}]`;
      }
      
      notesWithoutContent.push({
        id: noteId,
        decodedContent: decodedContent || '[EMPTY]'
      });
    }
  }
  
  console.log(`📝 Notes with CompressedContent: ${notesWithContent}`);
  console.log(`❓ Notes without CompressedContent: ${notesWithoutContent.length}`);
  console.log(`🔢 Total processed: ${totalProcessed}`);
  
  // Generate output file
  let output = '';
  output += `# Notes in decoded_notes.txt that have no CompressedContent\n`;
  output += `# Found ${notesWithoutContent.length} notes in decoded_notes.txt without meaningful CompressedContent\n`;
  output += `# Generated: ${new Date().toISOString()}\n\n`;
  
  for (const note of notesWithoutContent) {
    const originalNote = notesMap.get(note.id);
    output += `### ${note.id}: ${originalNote?.MarkupStyleName || 'None'}\n\n`;
    output += `${note.decodedContent}\n\n`;
    output += `---\n\n`;
  }
  
  await writeFile(outputFile, output, 'utf-8');
  
  console.log(`\n📊 Summary:`);
  console.log(`   Notes in decoded_notes.txt: ${decodedNoteIds.length}`);
  console.log(`   Notes with CompressedContent: ${notesWithContent}`);
  console.log(`   Notes without CompressedContent: ${notesWithoutContent.length}`);
  console.log(`   Missing notes (the ${notesWithoutContent.length} you asked for): saved to ${outputFile}`);
  
  console.log(`\n✅ Analysis complete! The ${notesWithoutContent.length} "missing" notes are in: ${outputFile}`);
} 