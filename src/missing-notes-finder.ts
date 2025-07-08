// this file was only used for debugging, but is kept here for reference

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { decodeLogosContent } from './decoder.js';
import type { NoteRecord } from './database.js';

/**
 * Find notes that have content but are missing from decoded_notes.txt
 */
export class MissingNotesFinder {
  
  /**
   * Parse decoded_notes.txt to extract note IDs that are present
   */
  public parseDecodedNotesFile(content: string): Set<number> {
    const noteIds = new Set<number>();
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Look for lines that start with "### " followed by a number
      const match = line.match(/^### (\d+):/);
      if (match && match[1]) {
        const noteId = parseInt(match[1], 10);
        noteIds.add(noteId);
      }
    }
    
    return noteIds;
  }

  /**
   * Find notes with content that are missing from decoded_notes.txt
   */
  public async findMissingNotes(
    notesJsonFile: string, 
    decodedNotesFile: string
  ): Promise<NoteRecord[]> {
    
    if (!existsSync(notesJsonFile)) {
      throw new Error(`Notes JSON file not found: ${notesJsonFile}`);
    }
    
    if (!existsSync(decodedNotesFile)) {
      throw new Error(`Decoded notes file not found: ${decodedNotesFile}`);
    }
    
    // Load all notes
    const allNotes: NoteRecord[] = JSON.parse(await readFile(notesJsonFile, 'utf-8'));
    
    // Parse decoded notes to get existing IDs
    const decodedContent = await readFile(decodedNotesFile, 'utf-8');
    const existingIds = this.parseDecodedNotesFile(decodedContent);
    
    console.log(`📂 Total notes in JSON: ${allNotes.length}`);
    console.log(`📄 Notes in decoded_notes.txt: ${existingIds.size}`);
    
    // Find notes with content that are not in decoded_notes.txt
    const missingNotes: NoteRecord[] = [];
    let notesWithContent = 0;
    
    for (const note of allNotes) {
      const hasContent = !!(note.CompressedContent && note.CompressedContent.trim());
      
      if (hasContent) {
        notesWithContent++;
        
        if (!existingIds.has(note.Id)) {
          missingNotes.push(note);
        }
      }
    }
    
    console.log(`📝 Total notes with content: ${notesWithContent}`);
    console.log(`❓ Missing notes: ${missingNotes.length}`);
    
    return missingNotes;
  }

  /**
   * Generate missing notes file in the same format as decoded_notes.txt
   */
  public async generateMissingNotesFile(
    missingNotes: NoteRecord[], 
    outputFile: string
  ): Promise<void> {
    
    let output = '';
    
    console.log(`🔄 Processing ${missingNotes.length} missing notes...`);
    
    for (let i = 0; i < missingNotes.length; i++) {
      const note = missingNotes[i];
      
      if (!note) {
        continue;
      }
      
      try {
        // Decode the content (note.CompressedContent is guaranteed to exist since we filtered for it)
        const decodedContent = decodeLogosContent(note.CompressedContent || '');
        
        // Format in the same style as decoded_notes.txt
        output += `### ${note.Id}: ${note.MarkupStyleName || 'None'}\n\n`;
        output += `${decodedContent}\n\n`;
        output += `---\n\n`;
        
        if ((i + 1) % 10 === 0) {
          console.log(`📝 Processed ${i + 1}/${missingNotes.length} notes...`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Failed to decode note ${note.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Still include it but with error message
        output += `### ${note.Id}: ${note.MarkupStyleName || 'None'}\n\n`;
        output += `[ERROR: Failed to decode content - ${error instanceof Error ? error.message : 'Unknown error'}]\n\n`;
        output += `---\n\n`;
      }
    }
    
    await writeFile(outputFile, output, 'utf-8');
    console.log(`📄 Missing notes written to: ${outputFile}`);
  }

  /**
   * Generate summary report
   */
  public generateSummaryReport(
    totalNotes: number,
    notesWithContent: number, 
    existingInDecoded: number,
    missingCount: number
  ): string {
    return `
🔍 Missing Notes Analysis
═══════════════════════════

📊 Total Notes: ${totalNotes}
📝 Notes with Content: ${notesWithContent}
📄 In decoded_notes.txt: ${existingInDecoded}
❓ Missing from decoded_notes.txt: ${missingCount}

🎯 The missing ${missingCount} notes have CompressedContent but were not included in the original decoded_notes.txt file.
`.trim();
  }
}

/**
 * Main function to find and generate missing notes
 */
export async function findAndGenerateMissingNotes(
  notesJsonFile: string = 'data/NotesTable.json',
  decodedNotesFile: string = 'data/decoded_notes.txt',
  outputFile: string = 'data/decoded_notes_missing.txt'
): Promise<void> {
  
  const finder = new MissingNotesFinder();
  
  console.log('🔍 Finding notes missing from decoded_notes.txt...');
  console.log(`📂 Notes JSON: ${notesJsonFile}`);
  console.log(`📄 Decoded notes: ${decodedNotesFile}`);
  console.log(`📝 Output: ${outputFile}`);
  console.log();
  
  const missingNotes = await finder.findMissingNotes(notesJsonFile, decodedNotesFile);
  
  if (missingNotes.length === 0) {
    console.log('🎉 No missing notes found! All notes with content are in decoded_notes.txt');
    return;
  }
  
  // Generate the missing notes file
  await finder.generateMissingNotesFile(missingNotes, outputFile);
  
  // Load existing file info for summary
  const decodedContent = await readFile(decodedNotesFile, 'utf-8');
  const existingIds = finder.parseDecodedNotesFile(decodedContent);
  
  // Count total notes with content
  const allNotes: NoteRecord[] = JSON.parse(await readFile(notesJsonFile, 'utf-8'));
  const notesWithContent = allNotes.filter(note => 
    !!(note.CompressedContent && note.CompressedContent.trim())
  ).length;
  
  console.log(finder.generateSummaryReport(
    allNotes.length,
    notesWithContent,
    existingIds.size,
    missingNotes.length
  ));
  
  console.log(`✅ Missing notes analysis complete!`);
} 