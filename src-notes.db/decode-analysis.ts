// this file was only used for debugging, but is kept here for reference

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { decodeLogosContent } from './decoder.js';
import { XamlToMarkdownConverter } from './xaml-converter.js';
import type { NoteRecord } from './database.js';

export interface DecodeAnalysisResult {
  noteId: number;
  hasCompressedContent: boolean;
  decodedLength: number;
  decodedContent: string;
  markupStyle: string;
  convertsToMarkdown: boolean;
  inDecodedFile: boolean;
}

/**
 * Analyze the gap between notes in decoded_notes.txt and successful markdown conversions
 */
export class DecodeAnalyzer {
  private converter: XamlToMarkdownConverter;

  constructor() {
    this.converter = new XamlToMarkdownConverter({ ignoreUnknownElements: true });
  }

  /**
   * Parse decoded_notes.txt to extract note IDs
   */
  public parseDecodedNotesFile(content: string): Set<number> {
    const noteIds = new Set<number>();
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^### (\d+):/);
      if (match && match[1]) {
        const noteId = parseInt(match[1], 10);
        noteIds.add(noteId);
      }
    }
    
    return noteIds;
  }

  /**
   * Analyze all notes to understand the conversion gap
   */
  public async analyzeConversionGap(
    notesJsonFile: string, 
    decodedNotesFile: string
  ): Promise<{
    totalNotesWithContent: number;
    notesInDecodedFile: number;
    successfulConversions: number;
    gapNotes: DecodeAnalysisResult[];
  }> {
    
    if (!existsSync(notesJsonFile)) {
      throw new Error(`Notes JSON file not found: ${notesJsonFile}`);
    }
    
    if (!existsSync(decodedNotesFile)) {
      throw new Error(`Decoded notes file not found: ${decodedNotesFile}`);
    }
    
    const allNotes: NoteRecord[] = JSON.parse(await readFile(notesJsonFile, 'utf-8'));
    const decodedContent = await readFile(decodedNotesFile, 'utf-8');
    const inDecodedFile = this.parseDecodedNotesFile(decodedContent);
    
    console.log(`📂 Total notes in JSON: ${allNotes.length}`);
    console.log(`📄 Notes in decoded_notes.txt: ${inDecodedFile.size}`);
    
    let totalNotesWithContent = 0;
    let successfulConversions = 0;
    const gapNotes: DecodeAnalysisResult[] = [];
    
    for (const note of allNotes) {
      const hasContent = !!(note.CompressedContent && note.CompressedContent.trim());
      
      if (hasContent) {
        totalNotesWithContent++;
        
        const analysis = this.analyzeNote(note, inDecodedFile.has(note.Id));
        
        if (analysis.convertsToMarkdown) {
          successfulConversions++;
        }
        
        // If it's in decoded file but doesn't convert to markdown, it's a "gap" note
        if (analysis.inDecodedFile && !analysis.convertsToMarkdown) {
          gapNotes.push(analysis);
        }
      }
    }
    
    console.log(`📝 Notes with CompressedContent: ${totalNotesWithContent}`);
    console.log(`✅ Successful conversions: ${successfulConversions}`);
    console.log(`❓ Gap notes (in decoded file but no markdown): ${gapNotes.length}`);
    
    return {
      totalNotesWithContent,
      notesInDecodedFile: inDecodedFile.size,
      successfulConversions,
      gapNotes
    };
  }

  /**
   * Analyze a single note
   */
  private analyzeNote(note: NoteRecord, inDecodedFile: boolean): DecodeAnalysisResult {
    const result: DecodeAnalysisResult = {
      noteId: note.Id,
      hasCompressedContent: !!(note.CompressedContent && note.CompressedContent.trim()),
      decodedLength: 0,
      decodedContent: '',
      markupStyle: note.MarkupStyleName || 'None',
      convertsToMarkdown: false,
      inDecodedFile
    };

    if (!result.hasCompressedContent) {
      return result;
    }

    try {
      // Decode the content
      result.decodedContent = decodeLogosContent(note.CompressedContent || '');
      result.decodedLength = result.decodedContent.length;

      if (result.decodedLength === 0) {
        return result;
      }

      // Try to convert to markdown
      const markdown = this.converter.convertToMarkdown(result.decodedContent);
      result.convertsToMarkdown = markdown.trim().length > 0;

    } catch (error) {
      // Failed to decode or convert - still counts as non-converting
    }

    return result;
  }

  /**
   * Generate a file showing the gap notes in decoded_notes.txt format
   */
  public async generateGapNotesFile(
    gapNotes: DecodeAnalysisResult[], 
    outputFile: string
  ): Promise<void> {
    let output = '';
    
    output += `# Gap Notes Analysis - ${gapNotes.length} notes in decoded_notes.txt that don't convert to Markdown\n`;
    output += `# Generated: ${new Date().toISOString()}\n`;
    output += `# These notes have CompressedContent but produce no meaningful Markdown output\n\n`;

    for (const note of gapNotes) {
      output += `### ${note.noteId}: ${note.markupStyle}\n\n`;
      output += `${note.decodedContent}\n\n`;
      output += `---\n\n`;
    }

    await writeFile(outputFile, output, 'utf-8');
    console.log(`📄 Gap notes written to: ${outputFile}`);
  }

  /**
   * Generate summary report
   */
  public generateSummaryReport(analysis: {
    totalNotesWithContent: number;
    notesInDecodedFile: number; 
    successfulConversions: number;
    gapNotes: DecodeAnalysisResult[];
  }): string {
    const gapCount = analysis.gapNotes.length;
    
    return `
🔍 Decode Analysis Summary
═══════════════════════════

📊 Notes with CompressedContent: ${analysis.totalNotesWithContent}
📄 Notes in decoded_notes.txt: ${analysis.notesInDecodedFile}
✅ Successful Markdown conversions: ${analysis.successfulConversions}
❓ Gap notes (in decoded file, no markdown): ${gapCount}

🎯 The ${gapCount} gap notes explain the difference between:
   • ${analysis.notesInDecodedFile} notes in decoded_notes.txt
   • ${analysis.successfulConversions} successful Markdown files

These gap notes have content but produce empty/malformed XAML that doesn't convert to meaningful Markdown.
`.trim();
  }
}

/**
 * Main function to analyze the conversion gap
 */
export async function analyzeConversionGap(
  notesJsonFile: string = 'data/NotesTable.json',
  decodedNotesFile: string = 'data/decoded_notes.txt',
  outputFile: string = 'data/decoded_notes_missing.txt'
): Promise<void> {
  
  const analyzer = new DecodeAnalyzer();
  
  console.log('🔍 Analyzing conversion gap between decoded_notes.txt and Markdown files...');
  console.log(`📂 Notes JSON: ${notesJsonFile}`);
  console.log(`📄 Decoded notes: ${decodedNotesFile}`);
  console.log(`📝 Output: ${outputFile}`);
  console.log();
  
  const analysis = await analyzer.analyzeConversionGap(notesJsonFile, decodedNotesFile);
  
  console.log(analyzer.generateSummaryReport(analysis));
  
  if (analysis.gapNotes.length > 0) {
    await analyzer.generateGapNotesFile(analysis.gapNotes, outputFile);
    console.log(`✅ Gap analysis complete! ${analysis.gapNotes.length} gap notes saved to: ${outputFile}`);
  } else {
    console.log('🎉 No gap found! All notes in decoded_notes.txt convert successfully to Markdown');
  }
} 