#!/usr/bin/env bun

// Main entry point for Logos Notes Exporter
// This file provides the primary CLI interface

export { NotesDatabase, type NoteRecord, type ExportOptions } from './src/database.js';
export { processAllNotes, processSingleNote, type ProcessOptions } from './src/processor.js';
export { decodeLogosContent, cleanUnicodeText, xamlToPlainText } from './src/decoder.js';
export { main as runCli, exportCommand, processCommand, decodeCommand, statsCommand } from './src/cli.js';

// If this file is run directly, execute the CLI
if (import.meta.main) {
  const { main } = await import('./src/cli.js');
  await main();
}