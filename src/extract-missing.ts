// this file was only used for debugging, but is kept here for reference

import { readFile, writeFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Extract the exact notes that are in decoded_notes.txt but missing from Markdown generation
 */
export async function extractMissingNotesFromDecoded(
  decodedNotesFile: string = 'data/decoded_notes.txt',
  markdownDir: string = 'data/notes',
  outputFile: string = 'data/decoded_notes_missing.txt'
): Promise<void> {
  
  if (!existsSync(decodedNotesFile)) {
    throw new Error(`Decoded notes file not found: ${decodedNotesFile}`);
  }
  
  // Get all note IDs from decoded_notes.txt
  const decodedContent = await readFile(decodedNotesFile, 'utf-8');
  const decodedNoteIds = new Set<number>();
  
  const lines = decodedContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^### (\d+):/);
    if (match && match[1]) {
      const noteId = parseInt(match[1], 10);
      decodedNoteIds.add(noteId);
    }
  }
  
  console.log(`📄 Notes in decoded_notes.txt: ${decodedNoteIds.size}`);
  
  // Get all note IDs that have successful Markdown files
  const markdownNoteIds = new Set<number>();
  
  if (existsSync(markdownDir)) {
    const files = readdirSync(markdownDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        // Extract note ID from filename like "Note-00005.md"
        const match = file.match(/Note-(\d+)\.md$/);
        if (match && match[1]) {
          const noteId = parseInt(match[1], 10);
          markdownNoteIds.add(noteId);
        }
      }
    }
  }
  
  console.log(`📝 Successful Markdown files: ${markdownNoteIds.size}`);
  
  // Find the missing note IDs (in decoded but not in markdown)
  const missingNoteIds = Array.from(decodedNoteIds).filter(id => !markdownNoteIds.has(id));
  missingNoteIds.sort((a, b) => a - b); // Sort numerically
  
  console.log(`❓ Missing notes: ${missingNoteIds.length}`);
  console.log(`🔢 Missing note IDs: ${missingNoteIds.slice(0, 10).join(', ')}${missingNoteIds.length > 10 ? '...' : ''}`);
  
  // Extract the missing notes directly from decoded_notes.txt
  await extractNotesFromDecodedFile(decodedNotesFile, missingNoteIds, outputFile);
  
  console.log(`✅ Extracted ${missingNoteIds.length} missing notes to: ${outputFile}`);
}

/**
 * Extract specific notes from decoded_notes.txt file by their IDs
 */
async function extractNotesFromDecodedFile(
  decodedNotesFile: string,
  noteIds: number[],
  outputFile: string
): Promise<void> {
  
  const decodedContent = await readFile(decodedNotesFile, 'utf-8');
  const lines = decodedContent.split('\n');
  
  let output = '';
  output += `# Missing Notes from Markdown Conversion\n`;
  output += `# These ${noteIds.length} notes are in decoded_notes.txt but were not converted to Markdown files\n`;
  output += `# Generated: ${new Date().toISOString()}\n`;
  output += `# Note IDs: ${noteIds.join(', ')}\n\n`;
  
  // Create a set for quick lookup
  const targetIds = new Set(noteIds);
  
  let currentNoteId: number | null = null;
  let currentNoteLines: string[] = [];
  let inTargetNote = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line) continue;
    
    // Check if this is a note header
    const match = line.match(/^### (\d+):/);
    if (match && match[1]) {
      // Save previous note if it was a target
      if (inTargetNote && currentNoteId !== null) {
        output += currentNoteLines.join('\n') + '\n\n';
      }
      
      // Start new note
      currentNoteId = parseInt(match[1], 10);
      inTargetNote = targetIds.has(currentNoteId);
      currentNoteLines = [line];
    } else if (inTargetNote) {
      // Add line to current note
      currentNoteLines.push(line);
    }
  }
  
  // Don't forget the last note
  if (inTargetNote && currentNoteId !== null) {
    output += currentNoteLines.join('\n') + '\n\n';
  }
  
  await writeFile(outputFile, output, 'utf-8');
} 