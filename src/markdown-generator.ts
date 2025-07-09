import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { XamlToMarkdownConverter } from './xaml-converter.js';
import { decodeLogosContent } from './decoder.js';
import type { NoteRecord } from './database.js';

export interface MarkdownGenerationOptions {
  outputDir?: string;
  includeEmptyNotes?: boolean;
  frontMatterFields?: string[];
  xamlConverterOptions?: any;
}

export interface MarkdownFile {
  filename: string;
  content: string;
  noteId: number;
  success: boolean;
  error?: string;
}

export interface GenerationStats {
  totalNotes: number;
  successfulFiles: number;
  skippedFiles: number;
  errorFiles: number;
  outputDirectory: string;
}

/**
 * Generate individual Markdown files from Notes data
 */
export class MarkdownFileGenerator {
  private converter: XamlToMarkdownConverter;
  private options: MarkdownGenerationOptions;

  constructor(options: MarkdownGenerationOptions = {}) {
    this.options = {
      outputDir: 'docs/notes',
      includeEmptyNotes: false,
      frontMatterFields: ['Note', 'MarkupStyle', 'Reference'],
      ...options
    };
    
    this.converter = new XamlToMarkdownConverter(options.xamlConverterOptions);
  }

  /**
   * Generate Markdown files from notes data
   */
  public async generateMarkdownFiles(notes: NoteRecord[]): Promise<GenerationStats> {
    const outputDir = this.options.outputDir!;
    
    // Ensure output directory exists
    await this.ensureDirectory(outputDir);

    const stats: GenerationStats = {
      totalNotes: notes.length,
      successfulFiles: 0,
      skippedFiles: 0,
      errorFiles: 0,
      outputDirectory: outputDir
    };

    const results: MarkdownFile[] = [];

    for (const note of notes) {
      try {
        const result = await this.generateSingleMarkdownFile(note, outputDir);
        results.push(result);

        if (result.success) {
          stats.successfulFiles++;
        } else if (result.error === 'No compressed content' || result.error === 'Empty note content (skipped)') {
          stats.skippedFiles++;
        } else {
          stats.errorFiles++;
        }
      } catch (error) {
        console.error(`Error processing note ${note.Id}:`, error);
        const errorResult = {
          filename: this.generateFilename(note.Id),
          content: '',
          noteId: note.Id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        if (errorResult.error === 'No compressed content' || errorResult.error === 'Empty note content (skipped)') {
          stats.skippedFiles++;
        } else {
          stats.errorFiles++;
        }
        
        results.push(errorResult);
      }
    }

    return stats;
  }

  /**
   * Generate a single Markdown file from a note
   */
  public async generateSingleMarkdownFile(note: NoteRecord, outputDir: string): Promise<MarkdownFile> {
    const filename = this.generateFilename(note.Id);
    const filePath = path.join(outputDir, filename);

    try {
      // Check for content in both CompressedContent and CompressedUserTitle
      const hasCompressedContent = !!(note.CompressedContent && note.CompressedContent.trim());
      const hasCompressedTitle = !!(note.CompressedUserTitle && note.CompressedUserTitle.trim());
      
      // Skip notes with no compressed content in either field
      if (!hasCompressedContent && !hasCompressedTitle) {
        return {
          filename,
          content: '',
          noteId: note.Id,
          success: false,
          error: 'No compressed content'
        };
      }

      // Decode both fields
      let decodedTitle = '';
      let decodedContent = '';
      
      if (hasCompressedTitle) {
        decodedTitle = decodeLogosContent(note.CompressedUserTitle!);
      }
      
      if (hasCompressedContent) {
        decodedContent = decodeLogosContent(note.CompressedContent!);
      }
      
      // Convert each field to Markdown separately, then combine
      let markdownTitle = '';
      let markdownContent = '';
      
      if (decodedTitle.trim()) {
        markdownTitle = this.converter.convertToMarkdown(decodedTitle).trim();
      }
      
      if (decodedContent.trim()) {
        markdownContent = this.converter.convertToMarkdown(decodedContent).trim();
      }
      
      // Combine markdown outputs with proper formatting:
      // CompressedUserTitle
      // (blank line if both have content)
      // CompressedContent
      const markdownParts = [markdownTitle, markdownContent].filter(Boolean);
      const finalMarkdownContent = markdownParts.join('\n\n');
      
      // Skip empty notes if configured
      if (!this.options.includeEmptyNotes && !finalMarkdownContent.trim()) {
        return {
          filename,
          content: '',
          noteId: note.Id,
          success: false,
          error: 'Empty note content (skipped)'
        };
      }
      
      // Debug: Log conversion details
      if (process.env.DEBUG) {
        console.log(`Note ${note.Id}: Title length: ${markdownTitle.length}, Content length: ${markdownContent.length}, Combined: ${finalMarkdownContent.length}`);
      }

      // Generate front matter
      const frontMatter = this.generateFrontMatter(note);

      // Combine front matter and content
      const fullContent = frontMatter + finalMarkdownContent;

      // Write file
      await writeFile(filePath, fullContent, 'utf-8');

      return {
        filename,
        content: fullContent,
        noteId: note.Id,
        success: true
      };

    } catch (error) {
      if (process.env.DEBUG) {
        console.error(`Error generating markdown for note ${note.Id}:`, error);
      }
      return {
        filename,
        content: '',
        noteId: note.Id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate filename for a note (Note-00033.md format)
   */
  private generateFilename(noteId: number): string {
    const paddedId = noteId.toString().padStart(5, '0');
    return `Note-${paddedId}.md`;
  }

  /**
   * Generate YAML front matter for a note
   */
  private generateFrontMatter(note: NoteRecord): string {
    const frontMatter: Record<string, any> = {};

    // Always include Note ID
    frontMatter.Note = note.Id;

    // Add MarkupStyleName (default to 'none' if empty)
    frontMatter.MarkupStyle = note.MarkupStyleName || 'none';

    // Add placeholder for Reference (to be implemented later)
    frontMatter.Reference = ''; // Will be populated later

    // Add other metadata if requested
    if (this.options.frontMatterFields) {
      for (const field of this.options.frontMatterFields) {
        if (field === 'Note' || field === 'MarkupStyle' || field === 'Reference') {
          continue; // Already handled above
        }

        switch (field.toLowerCase()) {
          case 'created':
            frontMatter.Created = note.Created;
            break;
          case 'modified':
            frontMatter.Modified = note.Modified;
            break;
          case 'tags':
            if (note.Tags) {
              frontMatter.Tags = note.Tags;
            }
            break;
          case 'color':
            if (note.Color !== null) {
              frontMatter.Color = note.Color;
            }
            break;
          case 'level':
            frontMatter.Level = note.Level;
            break;
          case 'rank':
            frontMatter.Rank = note.Rank;
            break;
          case 'markupkind':
            frontMatter.MarkupKind = note.MarkupKind;
            break;
          case 'indicatorkind':
            frontMatter.IndicatorKind = note.IndicatorKind;
            break;
        }
      }
    }

    // Convert to YAML format
    const yamlLines = ['---'];
    for (const [key, value] of Object.entries(frontMatter)) {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && (value.includes(':') || value.includes('\n'))) {
          yamlLines.push(`${key}: "${value}"`);
        } else {
          yamlLines.push(`${key}: ${value}`);
        }
      } else if (key === 'Reference') {
        yamlLines.push(`${key}: ""`); // Keep empty reference placeholder
      }
    }
    yamlLines.push('---');
    yamlLines.push('');

    return yamlLines.join('\n');
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Generate a summary report of the markdown generation
   */
  public generateSummaryReport(stats: GenerationStats): string {
    const successRate = ((stats.successfulFiles / stats.totalNotes) * 100).toFixed(1);
    
    return `
📝 Markdown Generation Summary
═══════════════════════════════

📂 Output Directory: ${stats.outputDirectory}
📊 Total Notes: ${stats.totalNotes}
✅ Successful Files: ${stats.successfulFiles}
❌ Failed Files: ${stats.errorFiles}
⏭️  Skipped Files: ${stats.skippedFiles}
📈 Success Rate: ${successRate}%

Files saved with format: Note-XXXXX.md (5-digit zero-padded)
Front matter includes: Note ID, MarkupStyle, Reference placeholder
`.trim();
  }

  /**
   * Preview a single note conversion without writing to file
   */
  public async previewNoteConversion(note: NoteRecord): Promise<{ 
    frontMatter: string; 
    markdownContent: string; 
    fullContent: string; 
    decodedXaml: string;
  }> {
    // Decode both fields (same logic as generateSingleMarkdownFile)
    const hasCompressedContent = !!(note.CompressedContent && note.CompressedContent.trim());
    const hasCompressedTitle = !!(note.CompressedUserTitle && note.CompressedUserTitle.trim());
    
    let decodedTitle = '';
    let decodedContent = '';
    
    if (hasCompressedTitle) {
      decodedTitle = decodeLogosContent(note.CompressedUserTitle!);
    }
    
    if (hasCompressedContent) {
      decodedContent = decodeLogosContent(note.CompressedContent!);
    }
    
    // Convert each field to Markdown separately, then combine (same as generateSingleMarkdownFile)
    let markdownTitle = '';
    let markdownContentPart = '';
    
    if (decodedTitle.trim()) {
      markdownTitle = this.converter.convertToMarkdown(decodedTitle).trim();
    }
    
    if (decodedContent.trim()) {
      markdownContentPart = this.converter.convertToMarkdown(decodedContent).trim();
    }
    
    // Combine for display
    const markdownContent = [markdownTitle, markdownContentPart].filter(Boolean).join('\n\n');
    const decodedXaml = [decodedTitle, decodedContent].filter(Boolean).join('\n\n');

    // Generate front matter
    const frontMatter = this.generateFrontMatter(note);

    // Combine for full content
    const fullContent = frontMatter + markdownContent;

    return {
      frontMatter,
      markdownContent,
      fullContent,
      decodedXaml
    };
  }
} 