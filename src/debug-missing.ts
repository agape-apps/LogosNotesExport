// this file was only used for debugging, but is kept here for reference

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { NoteRecord } from './database.js';
import { decodeLogosContent } from './decoder.js';
import { XamlToMarkdownConverter } from './xaml-converter.js';

/**
 * Debug utility to analyze why specific notes fail Markdown conversion
 */
export async function debugMissingNoteConversion(
  notesJsonFile: string = 'data/NotesTable.json',
  missingNoteIds: number[] = [10, 11, 44, 50, 82]
): Promise<void> {
  
  if (!existsSync(notesJsonFile)) {
    throw new Error(`Notes JSON file not found: ${notesJsonFile}`);
  }
  
  const allNotes: NoteRecord[] = JSON.parse(await readFile(notesJsonFile, 'utf-8'));
  const converter = new XamlToMarkdownConverter({ ignoreUnknownElements: true });
  
  console.log(`🔍 Debugging ${missingNoteIds.length} missing notes...`);
  console.log();
  
  for (const noteId of missingNoteIds) {
    const note = allNotes.find(n => n.Id === noteId);
    
    if (!note) {
      console.log(`❌ Note ${noteId}: NOT FOUND in JSON`);
      continue;
    }
    
    console.log(`🔍 Note ${noteId}: ${note.MarkupStyleName || 'None'}`);
    console.log(`📂 CompressedContent: ${note.CompressedContent ? 'Present' : 'Missing'} (length: ${note.CompressedContent?.length || 0})`);
    
    if (!note.CompressedContent || note.CompressedContent.trim() === '') {
      console.log(`   ❌ SKIP REASON: No compressed content`);
      console.log();
      continue;
    }
    
    try {
      // Try to decode
      const decodedContent = decodeLogosContent(note.CompressedContent);
      console.log(`📝 Decoded length: ${decodedContent.length}`);
      console.log(`📝 Decoded sample: "${decodedContent.substring(0, 100)}${decodedContent.length > 100 ? '...' : ''}"`);
      
      if (!decodedContent.trim()) {
        console.log(`   ❌ SKIP REASON: Empty decoded content`);
        console.log();
        continue;
      }
      
      // Try to convert to markdown
      const markdownContent = converter.convertToMarkdown(decodedContent);
      console.log(`📄 Markdown length: ${markdownContent.length}`);
      console.log(`📄 Markdown sample: "${markdownContent.substring(0, 100)}${markdownContent.length > 100 ? '...' : ''}"`);
      
      if (!markdownContent.trim()) {
        console.log(`   ❌ SKIP REASON: Empty markdown content after conversion`);
      } else {
        console.log(`   ✅ CONVERSION SUCCESS: Should generate markdown file`);
      }
      
    } catch (error) {
      console.log(`   ❌ CONVERSION ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log();
  }
} 