import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { decodeLogosContent } from './decoder.js';
import type { NoteRecord } from './database.js';

export interface ProcessOptions {
  inputFile?: string;
  outputFile?: string;
  markdown?: boolean;
}

export interface ProcessStats {
  processedCount: number;
  skippedCount: number;
  totalNotes: number;
}

/**
 * Process all notes and write decoded content to output file
 */
export async function processAllNotes(options: ProcessOptions = {}): Promise<ProcessStats> {
  const inputFile = options.inputFile || path.join('data', 'NotesTable.json');
  const outputFile = options.outputFile || path.join('data', 'decoded_notes.txt');
  const markdownFormat = options.markdown || false;

  // Check if input file exists
  if (!existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  try {
    // Read the JSON file
    const jsonContent = await readFile(inputFile, 'utf-8');
    const notes: NoteRecord[] = JSON.parse(jsonContent);

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    await Bun.write(path.join(outputDir, '.gitkeep'), '');

    // Process notes and write output
    let output = '';
    let processedCount = 0;
    let skippedCount = 0;

    for (const note of notes) {
      const noteId = note.Id || 'Unknown';
      const markupStyle = note.MarkupStyleName || 'None';
      const compressedContent = note.CompressedContent || '';
      const compressedTitle = note.CompressedUserTitle || '';

      // Skip if both fields are empty
      if (!compressedContent && !compressedTitle) {
        skippedCount++;
        continue;
      }

      // Decode the fields
      let decodedTitle = '';
      let decodedContent = '';

      if (compressedTitle) {
        decodedTitle = decodeLogosContent(compressedTitle);
        // Clean up error messages for display
        if (decodedTitle.startsWith('Error:')) {
          decodedTitle = `[DECODE ERROR: ${decodedTitle}]`;
        }
      }

      if (compressedContent) {
        decodedContent = decodeLogosContent(compressedContent);
        // Clean up error messages for display
        if (decodedContent.startsWith('Error:')) {
          decodedContent = `[DECODE ERROR: ${decodedContent}]`;
        }
      }

      // Write to output with new format matching Python script
      output += `### ${noteId}: ${markupStyle}\n\n`;  // Markdown heading with double newline
      
      if (decodedTitle) {
        output += `${decodedTitle}\n\n`;  // Title with double newline
      }
      
      if (decodedContent) {
        output += `${decodedContent}\n\n`;  // Content with double newline
      }

      // Add separator with blank lines before and after
      output += '---\n\n';

      processedCount++;
    }

    // Write the output file
    await writeFile(outputFile, output, 'utf-8');

    return {
      processedCount,
      skippedCount,
      totalNotes: notes.length
    };

  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${inputFile}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Process a single note and return decoded content
 */
export function processSingleNote(note: NoteRecord): { title: string; content: string } {
  const compressedContent = note.CompressedContent || '';
  const compressedTitle = note.CompressedUserTitle || '';

  let decodedTitle = '';
  let decodedContent = '';

  if (compressedTitle) {
    decodedTitle = decodeLogosContent(compressedTitle);
    if (decodedTitle.startsWith('Error:')) {
      decodedTitle = `[DECODE ERROR: ${decodedTitle}]`;
    }
  }

  if (compressedContent) {
    decodedContent = decodeLogosContent(compressedContent);
    if (decodedContent.startsWith('Error:')) {
      decodedContent = `[DECODE ERROR: ${decodedContent}]`;
    }
  }

  return {
    title: decodedTitle,
    content: decodedContent
  };
} 