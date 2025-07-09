#!/usr/bin/env bun

import { parseArgs } from 'util';
import { NotesDatabase, type ExportOptions } from './database.js';
import { processAllNotes, type ProcessOptions } from './processor.js';
import { decodeLogosContent } from './decoder.js';
import { MarkdownFileGenerator, type MarkdownGenerationOptions } from './markdown-generator.js';
import { NotesAnalyzer } from './analyzer.js';
import { findAndGenerateMissingNotes } from './missing-notes-finder.js';
import { analyzeConversionGap } from './decode-analysis.js';
import { findAllNotesInDecodedFile } from './simple-finder.js';
import { extractMissingNotesFromDecoded } from './extract-missing.js';
import { debugMissingNoteConversion } from './debug-missing.js';
import { debugDatabaseContent } from './db-debug.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface CliOptions {
  help?: boolean;
  database?: string;
  fromId?: number;
  toId?: number;
  output?: string;
  stats?: boolean;
  markdown?: boolean;
  input?: string;
  outputDir?: string;
  includeEmpty?: boolean;
  preview?: boolean;
}

const DEFAULT_DB_PATH = 'LogosDocuments/Documents/Notes/notes.db';

function showHelp(): void {
  console.log(`
📖 Logos Notes Exporter CLI

USAGE:
  bun run src/cli.ts [command] [options]

COMMANDS:
  export         Export notes to JSON (default command)
  process        Process notes and decode to plain text
  markdown       Generate individual Markdown files from notes
  stats          Show database statistics
  decode         Decode a single base64 string
  analyze        Analyze notes to identify missing conversions
  find-missing   Find notes missing from decoded_notes.txt
  gap-analysis   Analyze gap between decoded_notes.txt and Markdown conversions

OPTIONS:
  --database, -d   Path to notes.db file (default: ${DEFAULT_DB_PATH})
  --input, -i      Input JSON file for processing (default: data/NotesTable.json)
  --from-id        Export notes starting from this ID
  --to-id          Export notes up to this ID
  --output, -o     Output file path
  --output-dir     Output directory for Markdown files (default: data/notes)
  --include-empty  Include notes with empty content in Markdown generation
  --preview        Preview a single note conversion (use with --from-id)
  --markdown       Convert XAML to Markdown format (process command)
  --help, -h       Show this help message

EXAMPLES:
  # Export all notes to JSON
  bun run src/cli.ts export

  # Process and decode all notes to text
  bun run src/cli.ts process

  # Generate individual Markdown files for all notes
  bun run src/cli.ts markdown

  # Generate Markdown files with custom output directory
  bun run src/cli.ts markdown --output-dir data/my-notes

  # Preview conversion of a specific note
  bun run src/cli.ts markdown --preview --from-id 33

  # Export notes with ID range
  bun run src/cli.ts export --from-id 100 --to-id 200

  # Show database statistics
  bun run src/cli.ts stats

  # Decode a single base64 string
  bun run src/cli.ts decode "your_base64_string_here"

  # Analyze notes to find missing conversions
  bun run src/cli.ts analyze

  # Find notes missing from decoded_notes.txt
  bun run src/cli.ts find-missing

  # Analyze gap between decoded notes and Markdown conversions
  bun run src/cli.ts gap-analysis

  # Use custom database location
  bun run src/cli.ts export --database ./path/to/notes.db
`);
}

function parseCliArgs(): { command: string; options: CliOptions; positionals: string[] } {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      help: { type: 'boolean', short: 'h' },
      database: { type: 'string', short: 'd' },
      input: { type: 'string', short: 'i' },
      'from-id': { type: 'string' },
      'to-id': { type: 'string' },
      output: { type: 'string', short: 'o' },
      'output-dir': { type: 'string' },
      'include-empty': { type: 'boolean' },
      preview: { type: 'boolean' },
      markdown: { type: 'boolean' },
    },
    allowPositionals: true,
  });

  const command = positionals[0] || 'export';
  const options: CliOptions = {
    help: values.help,
    database: values.database,
    input: values.input,
    fromId: values['from-id'] ? parseInt(values['from-id'], 10) : undefined,
    toId: values['to-id'] ? parseInt(values['to-id'], 10) : undefined,
    output: values.output,
    outputDir: values['output-dir'],
    includeEmpty: values['include-empty'],
    preview: values.preview,
    stats: command === 'stats',
    markdown: values.markdown,
  };

  return { command, options, positionals: positionals.slice(1) };
}

async function exportCommand(options: CliOptions): Promise<void> {
  const dbPath = options.database || DEFAULT_DB_PATH;
  const db = new NotesDatabase(dbPath);

  try {
    console.log(`📂 Opening database: ${dbPath}`);
    
    const exportOptions: ExportOptions = {
      fromId: options.fromId,
      toId: options.toId,
      outputPath: options.output,
    };

    // Validate ID range
    if (options.fromId && options.toId && options.fromId > options.toId) {
      console.error('❌ Error: --from-id cannot be greater than --to-id');
      process.exit(1);
    }

    const result = await db.exportToJson(exportOptions);
    console.log(`✅ ${result}`);
  } catch (error) {
    console.error(`❌ Export failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    db.close();
  }
}

async function processCommand(options: CliOptions): Promise<void> {
  try {
    console.log(`🔄 Processing notes and decoding content...`);
    
    const processOptions: ProcessOptions = {
      inputFile: options.input,
      outputFile: options.output,
      markdown: options.markdown,
    };

    const inputFile = processOptions.inputFile || path.join('data', 'NotesTable.json');
    const outputFile = processOptions.outputFile || path.join('data', 'decoded_notes.txt');

    console.log(`📂 Input file: ${inputFile}`);
    console.log(`📄 Output file: ${outputFile}`);
    if (options.markdown) {
      console.log(`✨ Format: Markdown (human-readable)`);
    } else {
      console.log(`📋 Format: Raw XAML`);
    }
    console.log();

    const stats = await processAllNotes(processOptions);
    
    const formatType = options.markdown ? 'Markdown' : 'XAML';
    console.log(`✅ Processing complete!`);
    console.log(`📝 Processed ${stats.processedCount} notes in ${formatType} format`);
    console.log(`⏭️ Skipped ${stats.skippedCount} empty notes`);
    console.log(`📊 Total notes: ${stats.totalNotes}`);
    console.log(`💾 Output written to: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Processing failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function decodeCommand(base64String: string): Promise<void> {
  if (!base64String) {
    console.error('❌ Error: Please provide a base64 string to decode');
    process.exit(1);
  }

  try {
    console.log(`🔓 Decoding base64 string...`);
    const result = decodeLogosContent(base64String);
    console.log(`📄 Decoded content:`);
    console.log(result);
  } catch (error) {
    console.error(`❌ Decode failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function markdownCommand(options: CliOptions): Promise<void> {
  try {
    const inputFile = options.input || path.join('data', 'NotesTable.json');
    const outputDir = options.outputDir || 'data/notes';

    console.log(`📝 Generating Markdown files from notes...`);
    console.log(`📂 Input file: ${inputFile}`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log();

    // Load notes data
    if (!existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      console.error(`💡 Run 'export' command first to generate the JSON file`);
      process.exit(1);
    }

    const notesData = JSON.parse(await readFile(inputFile, 'utf-8'));
    
    // Filter notes if ID range specified
    let filteredNotes = notesData;
    if (options.fromId || options.toId) {
      filteredNotes = notesData.filter((note: any) => {
        if (options.fromId && note.Id < options.fromId) return false;
        if (options.toId && note.Id > options.toId) return false;
        return true;
      });
      console.log(`🔍 Filtered to ${filteredNotes.length} notes (ID range: ${options.fromId || 'start'}-${options.toId || 'end'})`);
    }

    // Preview mode for single note
    if (options.preview) {
      if (!options.fromId) {
        console.error(`❌ Preview mode requires --from-id to specify which note to preview`);
        process.exit(1);
      }

      const note = filteredNotes.find((n: any) => n.Id === options.fromId);
      if (!note) {
        console.error(`❌ Note with ID ${options.fromId} not found`);
        process.exit(1);
      }

      const generator = new MarkdownFileGenerator({ 
        outputDir,
        includeEmptyNotes: options.includeEmpty 
      });
      
      const preview = await generator.previewNoteConversion(note);
      
      console.log(`🔍 Preview for Note ${note.Id}:`);
      console.log(`\n📄 Front Matter:`);
      console.log(preview.frontMatter);
      console.log(`📝 Markdown Content:`);
      console.log(preview.markdownContent || '(empty content)');
      console.log(`\n🔧 Original XAML (first 200 chars):`);
      console.log(preview.decodedXaml.substring(0, 200) + (preview.decodedXaml.length > 200 ? '...' : ''));
      
      return;
    }

    // Generate all markdown files
    const generationOptions: MarkdownGenerationOptions = {
      outputDir,
      includeEmptyNotes: options.includeEmpty,
    };

    const generator = new MarkdownFileGenerator(generationOptions);
    const stats = await generator.generateMarkdownFiles(filteredNotes);

    console.log(generator.generateSummaryReport(stats));
    
  } catch (error) {
    console.error(`❌ Markdown generation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function statsCommand(options: CliOptions): Promise<void> {
  const dbPath = options.database || DEFAULT_DB_PATH;
  const db = new NotesDatabase(dbPath);

  try {
    console.log(`📂 Database: ${dbPath}`);
    
    const stats = db.getStats();
    console.log(`
📊 Database Statistics:
   Total Notes: ${stats.totalNotes}
   ID Range: ${stats.minId} - ${stats.maxId}
`);
  } catch (error) {
    console.error(`❌ Stats failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    db.close();
  }
}

async function analyzeCommand(options: CliOptions): Promise<void> {
  try {
    const inputFile = options.input || path.join('data', 'NotesTable.json');
    const outputFile = options.output || path.join('data', 'missing_notes_xaml.txt');

    console.log(`🔍 Analyzing notes to identify missing conversions...`);
    console.log(`📂 Input file: ${inputFile}`);
    console.log(`📄 Output file: ${outputFile}`);
    console.log();

    if (!existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      console.error(`💡 Run 'export' command first to generate the JSON file`);
      process.exit(1);
    }
    
    const analyzer = new NotesAnalyzer();
    const report = await analyzer.analyzeMissingNotes(inputFile);
    
    console.log(analyzer.generateSummaryReport(report));
    
    // Generate the missing notes file
    await analyzer.generateMissingNotesFile(report.missingNoteDetails, outputFile);
    
    console.log(`✅ Analysis complete! Missing notes XAML saved to: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function findMissingCommand(options: CliOptions): Promise<void> {
  try {
    const notesJsonFile = options.input || path.join('data', 'NotesTable.json');
    const decodedNotesFile = path.join('data', 'decoded_notes.txt');
    const outputFile = options.output || path.join('data', 'decoded_notes_missing.txt');

    console.log(`🔍 Finding notes missing from decoded_notes.txt...`);
    console.log(`📂 Notes JSON: ${notesJsonFile}`);
    console.log(`📄 Decoded notes: ${decodedNotesFile}`);
    console.log(`📝 Output: ${outputFile}`);
    console.log();

    if (!existsSync(notesJsonFile)) {
      console.error(`❌ Notes JSON file not found: ${notesJsonFile}`);
      console.error(`💡 Run 'export' command first to generate the JSON file`);
      process.exit(1);
    }

    if (!existsSync(decodedNotesFile)) {
      console.error(`❌ Decoded notes file not found: ${decodedNotesFile}`);
      console.error(`💡 Run 'process' command first to generate the decoded notes file`);
      process.exit(1);
    }
    
    await findAndGenerateMissingNotes(notesJsonFile, decodedNotesFile, outputFile);
    
  } catch (error) {
    console.error(`❌ Find missing failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function gapAnalysisCommand(options: CliOptions): Promise<void> {
  try {
    const notesJsonFile = options.input || path.join('data', 'NotesTable.json');
    const decodedNotesFile = path.join('data', 'decoded_notes.txt');
    const outputFile = options.output || path.join('data', 'decoded_notes_missing.txt');

    console.log(`🔍 Analyzing gap between decoded_notes.txt and Markdown conversions...`);
    console.log(`📂 Notes JSON: ${notesJsonFile}`);
    console.log(`📄 Decoded notes: ${decodedNotesFile}`);
    console.log(`📝 Output: ${outputFile}`);
    console.log();

    if (!existsSync(notesJsonFile)) {
      console.error(`❌ Notes JSON file not found: ${notesJsonFile}`);
      console.error(`💡 Run 'export' command first to generate the JSON file`);
      process.exit(1);
    }

    if (!existsSync(decodedNotesFile)) {
      console.error(`❌ Decoded notes file not found: ${decodedNotesFile}`);
      console.error(`💡 Run 'process' command first to generate the decoded notes file`);
      process.exit(1);
    }
    
    await analyzeConversionGap(notesJsonFile, decodedNotesFile, outputFile);
    
  } catch (error) {
    console.error(`❌ Gap analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const { command, options, positionals } = parseCliArgs();

  if (options.help) {
    showHelp();
    return;
  }

  switch (command) {
    case 'export':
      await exportCommand(options);
      break;
    case 'process':
      await processCommand(options);
      break;
    case 'markdown':
      await markdownCommand(options);
      break;
    case 'decode':
      await decodeCommand(positionals[0] || '');
      break;
    case 'stats':
      await statsCommand(options);
      break;
    // from here down to debug-db was all for debugging only
    // these options and related code should be removed later
    case 'analyze':
      await analyzeCommand(options);
      break;
    case 'find-missing':
      await findMissingCommand(options);
      break;
    case 'gap-analysis':
      await gapAnalysisCommand(options);
      break;
    case 'simple-missing':
      try {
        await findAllNotesInDecodedFile();
      } catch (error) {
        console.error(`❌ Simple missing analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
      break;
    case 'extract-missing':
      try {
        await extractMissingNotesFromDecoded();
      } catch (error) {
        console.error(`❌ Extract missing failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
      break;
    case 'debug-missing':
      try {
        const sampleIds = [10, 11, 44, 50, 82, 99, 111, 114, 115, 116];
        await debugMissingNoteConversion('data/NotesTable.json', sampleIds);
      } catch (error) {
        console.error(`❌ Debug missing failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
      break;
    case 'debug-db':
      try {
        const sampleIds = [10, 11, 44, 50, 82];
        await debugDatabaseContent(options.database || DEFAULT_DB_PATH, sampleIds);
      } catch (error) {
        console.error(`❌ Debug database failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Use --help to see available commands');
      process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.main) {
  main().catch((error) => {
    console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}

export { main, exportCommand, processCommand, markdownCommand, decodeCommand, statsCommand, analyzeCommand, findMissingCommand, gapAnalysisCommand }; 