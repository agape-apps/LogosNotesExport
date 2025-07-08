#!/usr/bin/env bun

import { parseArgs } from 'util';
import { NotesDatabase, type ExportOptions } from './database.js';
import { processAllNotes, type ProcessOptions } from './processor.js';
import { decodeLogosContent } from './decoder.js';
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
  stats          Show database statistics
  decode         Decode a single base64 string

OPTIONS:
  --database, -d   Path to notes.db file (default: ${DEFAULT_DB_PATH})
  --input, -i      Input JSON file for processing (default: data/NotesTable.json)
  --from-id        Export notes starting from this ID
  --to-id          Export notes up to this ID
  --output, -o     Output file path
  --markdown       Convert XAML to Markdown format (process command)
  --help, -h       Show this help message

EXAMPLES:
  # Export all notes to JSON
  bun run src/cli.ts export

  # Process and decode all notes to text
  bun run src/cli.ts process

  # Process with custom input/output
  bun run src/cli.ts process --input data/NotesTable.json --output data/my_notes.txt

  # Export notes with ID range
  bun run src/cli.ts export --from-id 100 --to-id 200

  # Show database statistics
  bun run src/cli.ts stats

  # Decode a single base64 string
  bun run src/cli.ts decode "your_base64_string_here"

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
    case 'decode':
      await decodeCommand(positionals[0] || '');
      break;
    case 'stats':
      await statsCommand(options);
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

export { main, exportCommand, processCommand, decodeCommand, statsCommand }; 