#!/usr/bin/env bun

// Main entry point for Logos Notes Exporter
// This file provides the primary CLI interface

// Database and core types
export { NotesToolDatabase, type NotesToolNote, type BibleReference, type Notebook } from './src/notestool-database.js';
export { DatabaseLocator, type DatabaseLocation } from './src/database-locator.js';

// Organization and processing
export { NotebookOrganizer, type OrganizedNote, type NotebookGroup, type OrganizationStats } from './src/notebook-organizer.js';
export { BibleReferenceDecoder, type DecodedReference, type BibleBookMapping } from './src/reference-decoder.js';

// Content conversion
export { XamlToMarkdownConverter, type XamlConverterOptions, DEFAULT_OPTIONS as DEFAULT_XAML_OPTIONS } from './src/xaml-converter.js';
export { MarkdownConverter, type MarkdownOptions, type MarkdownResult, DEFAULT_MARKDOWN_OPTIONS } from './src/markdown-converter.js';

// File operations
export { FileOrganizer, type FileStructureOptions, type FilePathInfo, type DirectoryStructure, DEFAULT_FILE_OPTIONS } from './src/file-organizer.js';

// Validation
export { ExportValidator, type ValidationOptions, type ValidationResult, type ValidationIssue } from './src/validator.js';

// CLI interface
export { LogosNotesExporter, parseCommandLine, validateOptions, main } from './src/cli.js';

// If this file is run directly, execute the CLI
if (import.meta.main) {
  const { main } = await import('./src/cli.js');
  await main();
}