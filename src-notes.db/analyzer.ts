import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { decodeLogosContent } from './decoder.js';
import { XamlToMarkdownConverter } from './xaml-converter.js';
import type { NoteRecord } from './database.js';

export interface AnalysisResult {
  noteId: number;
  hasCompressedContent: boolean;
  decodedLength: number;
  decodedContent: string;
  conversionSuccessful: boolean;
  markdownLength: number;
  error?: string;
}

export interface MissingNotesReport {
  totalNotes: number;
  notesWithContent: number;
  successfulConversions: number;
  missingNotes: number;
  missingNoteDetails: AnalysisResult[];
}

/**
 * Analyzer for identifying notes that have content but fail to convert
 */
export class NotesAnalyzer {
  private converter: XamlToMarkdownConverter;

  constructor() {
    this.converter = new XamlToMarkdownConverter({ ignoreUnknownElements: true });
  }

  /**
   * Analyze all notes and identify the "missing" ones
   */
  public async analyzeMissingNotes(inputFile: string): Promise<MissingNotesReport> {
    if (!existsSync(inputFile)) {
      throw new Error(`Input file not found: ${inputFile}`);
    }

    const notesData: NoteRecord[] = JSON.parse(await readFile(inputFile, 'utf-8'));
    
    const analysis: AnalysisResult[] = [];
    let notesWithContent = 0;
    let successfulConversions = 0;

    console.log(`🔍 Analyzing ${notesData.length} notes...`);

    for (const note of notesData) {
      const result = this.analyzeNote(note);
      analysis.push(result);

      if (result.hasCompressedContent && result.decodedLength > 0) {
        notesWithContent++;
        
        if (result.conversionSuccessful) {
          successfulConversions++;
        }
      }
    }

    // Filter to get the "missing" notes - those with content but failed conversion
    const missingNotes = analysis.filter(result => 
      result.hasCompressedContent && 
      result.decodedLength > 0 && 
      !result.conversionSuccessful
    );

    return {
      totalNotes: notesData.length,
      notesWithContent,
      successfulConversions,
      missingNotes: missingNotes.length,
      missingNoteDetails: missingNotes
    };
  }

  /**
   * Analyze a single note
   */
  private analyzeNote(note: NoteRecord): AnalysisResult {
    const result: AnalysisResult = {
      noteId: note.Id,
      hasCompressedContent: !!(note.CompressedContent && note.CompressedContent.trim()),
      decodedLength: 0,
      decodedContent: '',
      conversionSuccessful: false,
      markdownLength: 0
    };

    if (!result.hasCompressedContent) {
      return result;
    }

    try {
      // Decode the content
      result.decodedContent = decodeLogosContent(note.CompressedContent);
      result.decodedLength = result.decodedContent.length;

      if (result.decodedLength === 0) {
        return result;
      }

      // Try to convert to markdown
      const markdown = this.converter.convertToMarkdown(result.decodedContent);
      result.markdownLength = markdown.length;
      result.conversionSuccessful = markdown.trim().length > 0;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Generate a report file of missing notes in the same format as decoded_notes.txt
   */
  public async generateMissingNotesFile(
    missingNotes: AnalysisResult[], 
    outputFile: string
  ): Promise<void> {
    let output = '';
    
    output += `# Missing Notes Analysis - ${missingNotes.length} notes with content but failed conversion\n`;
    output += `# Generated: ${new Date().toISOString()}\n`;
    output += `# Format: Note ID, Decoded Length, XAML Content\n\n`;

    for (const note of missingNotes) {
      output += `\n=== Note ID: ${note.noteId} ===\n`;
      output += `Decoded Length: ${note.decodedLength} characters\n`;
      output += `Conversion Error: ${note.error || 'Content exists but produces no markdown'}\n`;
      output += `XAML Content:\n`;
      output += `${note.decodedContent}\n`;
      output += `\n--- End Note ${note.noteId} ---\n\n`;
    }

    await writeFile(outputFile, output, 'utf-8');
    console.log(`📄 Missing notes XAML written to: ${outputFile}`);
  }

  /**
   * Generate a summary report
   */
  public generateSummaryReport(report: MissingNotesReport): string {
    const missingRate = ((report.missingNotes / report.notesWithContent) * 100).toFixed(1);
    const successRate = ((report.successfulConversions / report.notesWithContent) * 100).toFixed(1);

    return `
🔍 Missing Notes Analysis Summary
═══════════════════════════════════

📊 Total Notes: ${report.totalNotes}
📝 Notes with Content: ${report.notesWithContent}
✅ Successful Conversions: ${report.successfulConversions} (${successRate}%)
❓ Missing Conversions: ${report.missingNotes} (${missingRate}%)

🎯 Theory Verification:
   • ${report.successfulConversions} notes converted successfully to Markdown
   • ${report.missingNotes} notes have content but failed conversion
   • These ${report.missingNotes} notes likely contain minimal/malformed XAML

📄 Check the generated file to inspect the XAML content of missing notes.
`.trim();
  }
} 