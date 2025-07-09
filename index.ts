#!/usr/bin/env bun

// Main entry point for Logos Notes Exporter
// This file provides the primary CLI interface

export { NotesDatabase, type NoteRecord, type ExportOptions } from './src-notes.db/database.js';
export { processAllNotes, processSingleNote, type ProcessOptions } from './src-notes.db/processor.js';
export { decodeLogosContent, cleanUnicodeText, xamlToPlainText } from './src-notes.db/decoder.js';
export { XamlToMarkdownConverter, type XamlConverterOptions, DEFAULT_OPTIONS as DEFAULT_XAML_OPTIONS } from './src-notes.db/xaml-converter.js';
export { MarkdownFileGenerator, type MarkdownGenerationOptions, type MarkdownFile, type GenerationStats } from './src-notes.db/markdown-generator.js';
export { main as runCli, exportCommand, processCommand, markdownCommand, decodeCommand, statsCommand } from './src-notes.db/cli.js';

// If this file is run directly, execute the CLI
if (import.meta.main) {
  const { main } = await import('./src-notes.db/cli.js');
  await main();
}