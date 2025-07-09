#!/usr/bin/env bun
import { parseArgs } from 'util';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { NotebookOrganizer } from './notebook-organizer.js';
import { FileOrganizer, DEFAULT_FILE_OPTIONS } from './file-organizer.js';
import { MarkdownConverter, DEFAULT_MARKDOWN_OPTIONS } from './markdown-converter.js';
import type { FileStructureOptions, MarkdownOptions } from './types.js';
import { ExportValidator } from './validator.js';

interface CLIOptions {
  /** Database file path */
  database?: string;
  /** Output directory */
  output?: string;
  /** Organization options */
  organizeByNotebooks?: boolean;
  includeDateFolders?: boolean;
  createIndexFiles?: boolean;
  /** Markdown options */
  includeFrontmatter?: boolean;
  includeMetadata?: boolean;
  includeDates?: boolean;
  includeReferences?: boolean;
  includeNotebook?: boolean;
  includeId?: boolean;
  dateFormat?: 'iso' | 'locale' | 'short';
  /** Processing options */
  verbose?: boolean;
  dryRun?: boolean;
  help?: boolean;
  version?: boolean;
}

const HELP_TEXT = `
Logos Notes Exporter - Convert Logos notes to Markdown

USAGE:
  bun run cli.ts [OPTIONS]

OPTIONS:
  --database, -d        Path to NotesTool database file
  --output, -o          Output directory (default: ./exported-notes)
  
  ORGANIZATION:
  --organize-notebooks  Organize notes by notebooks (default: true)
  --date-folders        Create date-based subdirectories
  --index-files         Create README.md index files (default: true)
  
  MARKDOWN:
  --frontmatter         Include YAML frontmatter (default: true)
  --metadata            Include metadata in content (default: true)
  --dates               Include creation/modification dates (default: true)
  --references          Include Bible references (default: true)
  --notebook-info       Include notebook information (default: true)
  --include-id          Include note IDs
  --date-format         Date format: iso, locale, short (default: iso)
  
  PROCESSING:
  --verbose, -v         Verbose output
  --dry-run            Show what would be done without writing files
  --help, -h           Show this help
  --version            Show version

EXAMPLES:
  # Basic export
  bun run cli.ts --database ./NotesTool/notestool.db
  
  # Custom output with date folders
  bun run cli.ts -d ./notes.db -o ./my-notes --date-folders
  
  # Dry run to see what would be exported
  bun run cli.ts --dry-run --verbose
  
  # Export without frontmatter
  bun run cli.ts --no-frontmatter --metadata

NOTES:
  - Default database location: LogosDocuments/NotesToolManager/notestool.db
  - Output files will be organized by notebooks unless --no-organize-notebooks
  - Existing files will be overwritten
`;

class LogosNotesExporter {
  private organizer: NotebookOrganizer;
  private fileOrganizer: FileOrganizer;
  private markdownConverter: MarkdownConverter;
  private validator: ExportValidator;
  private options: CLIOptions;

  constructor(options: CLIOptions) {
    this.options = options;
    
    // Initialize components with options
    const dbPath = options.database || 'LogosDocuments/NotesToolManager/notestool.db';
    this.organizer = new NotebookOrganizer(dbPath);
    
    // Configure file organizer
    const fileOptions: Partial<FileStructureOptions> = {
      baseDir: options.output || './exported-notes',
      organizeByNotebooks: options.organizeByNotebooks !== false,
      includeDateFolders: options.includeDateFolders || false,
      createIndexFiles: options.createIndexFiles !== false,
    };
    this.fileOrganizer = new FileOrganizer(fileOptions);
    
    // Configure markdown converter
    const markdownOptions: Partial<MarkdownOptions> = {
      includeFrontmatter: options.includeFrontmatter !== false,
      includeMetadata: options.includeMetadata !== false,
      includeDates: options.includeDates !== false,
      includeReferences: options.includeReferences !== false,
      includeNotebook: options.includeNotebook !== false,
      includeId: options.includeId || false,
      dateFormat: options.dateFormat || 'iso',
    };
    this.markdownConverter = new MarkdownConverter(markdownOptions);
    this.validator = new ExportValidator();
  }

  /**
   * Main export process
   */
  public async export(): Promise<void> {
    try {
      this.log('Starting Logos Notes export...\n');

      // Step 1: Organize notes by notebooks
      this.log('📚 Organizing notes by notebooks...');
      const notebookGroups = await this.organizer.organizeNotes();
      this.log(`Found ${notebookGroups.length} notebook groups`);

      // Step 2: Get organization stats
      const stats = this.organizer.getOrganizationStats();
      this.logStats(stats);

      // Step 3: Plan file structure
      this.log('\n📁 Planning file structure...');
      const structure = await this.fileOrganizer.planDirectoryStructure(notebookGroups);
      const summary = this.fileOrganizer.getFileOperationSummary(notebookGroups);
      this.logFileSummary(summary);

      if (this.options.dryRun) {
        this.log('\n🔍 DRY RUN - No files will be written');
        this.logDryRunSummary(notebookGroups);
        return;
      }

      // Step 4: Process each notebook group
      this.log('\n📝 Converting notes to markdown...');
      let totalProcessed = 0;

      for (const group of notebookGroups) {
        const notebookName = group.notebook?.title || 'Orphaned Notes';
        this.log(`\nProcessing: ${notebookName} (${group.notes.length} notes)`);

        // Resolve filename conflicts
        const fileMap = this.fileOrganizer.resolveFilenameConflicts(group.notes, group);
        
        // Convert notes to markdown
        const markdownResults = this.markdownConverter.convertNotebook(group, fileMap);

        // Write notes to files
        for (const [note, result] of markdownResults) {
          const fileInfo = fileMap.get(note);
          if (fileInfo) {
            await this.fileOrganizer.writeFile(fileInfo, result.content);
            totalProcessed++;
            
            if (this.options.verbose) {
              this.log(`  ✓ ${fileInfo.filename}`);
            }
          }
        }

        // Create notebook index
        if (this.fileOrganizer.getOptions().createIndexFiles) {
          const indexContent = this.fileOrganizer.generateNotebookIndex(group);
          const indexPath = join(this.fileOrganizer.getNotebookDirectory(group), 'README.md');
          await this.fileOrganizer.ensureDirectory(this.fileOrganizer.getNotebookDirectory(group));
          await this.fileOrganizer.writeFile({
            fullPath: indexPath,
            directory: this.fileOrganizer.getNotebookDirectory(group),
            filename: 'README',
            relativePath: indexPath.replace(this.fileOrganizer.getOptions().baseDir + '/', ''),
            exists: false
          }, indexContent);
        }
      }

      // Step 5: Create main index
      if (this.fileOrganizer.getOptions().createIndexFiles) {
        this.log('\n📋 Creating main index...');
        const mainIndexContent = this.fileOrganizer.generateMainIndex(notebookGroups, stats);
        const mainIndexPath = join(this.fileOrganizer.getOptions().baseDir, 'README.md');
        await this.fileOrganizer.writeFile({
          fullPath: mainIndexPath,
          directory: this.fileOrganizer.getOptions().baseDir,
          filename: 'README',
          relativePath: 'README.md',
          exists: false
        }, mainIndexContent);
      }

      // Step 7: Validate export (if enabled)
      if (!this.options.dryRun) {
        this.log('\n🔍 Validating export...');
        const allNotes = notebookGroups.flatMap(group => group.notes);
        const validationResult = await this.validator.validateExport(
          this.fileOrganizer.getOptions().baseDir,
          allNotes,
          notebookGroups
        );

        // Display validation results
        this.displayValidationResults(validationResult);
        
        if (!validationResult.isValid) {
          this.log('\n⚠️  Export completed with validation issues. See details above.');
        }
      }

      // Step 8: Show completion summary
      this.log('\n✅ Export completed successfully!');
      this.log(`📁 Output directory: ${this.fileOrganizer.getOptions().baseDir}`);
      this.log(`📄 Total files created: ${totalProcessed}`);
      this.log(`📚 Notebooks processed: ${notebookGroups.length}`);
      
    } catch (error) {
      console.error('\n❌ Export failed:', error);
      process.exit(1);
    } finally {
      this.organizer.close();
    }
  }

  /**
   * Log message if not in quiet mode
   */
  private log(message: string): void {
    console.log(message);
  }

  /**
   * Log organization statistics
   */
  private logStats(stats: any): void {
    this.log(`\n📊 Statistics:`);
    this.log(`  Total Notes: ${stats.totalNotes}`);
    this.log(`  Notes with Content: ${stats.notesWithContent}`);
    this.log(`  Notes with References: ${stats.notesWithReferences}`);
    this.log(`  Notebooks: ${stats.notebooks}`);
    this.log(`  Orphaned Notes: ${stats.orphanedNotes}`);
  }

  /**
   * Log file operation summary
   */
  private logFileSummary(summary: any): void {
    this.log(`  Directories to create: ${summary.totalDirectories}`);
    this.log(`  Notes to export: ${summary.totalFiles}`);
    this.log(`  Index files to create: ${summary.totalIndexFiles}`);
    this.log(`  Estimated size: ${summary.estimatedSize}`);
  }

  /**
   * Log dry run summary
   */
  private logDryRunSummary(notebookGroups: any[]): void {
    for (const group of notebookGroups) {
      const notebookName = group.notebook?.title || 'Orphaned Notes';
      this.log(`\n📚 ${notebookName}:`);
      this.log(`  📄 ${group.notes.length} notes would be exported`);
      
      if (this.options.verbose) {
        for (const note of group.notes.slice(0, 5)) {
          this.log(`    - ${note.formattedTitle || 'Untitled'}`);
        }
        if (group.notes.length > 5) {
          this.log(`    ... and ${group.notes.length - 5} more`);
        }
      }
    }
  }

  /**
   * Display validation results to the user
   */
  private displayValidationResults(result: any): void {
    this.log(`\n📋 ${result.summary}`);
    
    if (result.issues.length > 0) {
      const errors = result.issues.filter((i: any) => i.severity === 'error');
      const warnings = result.issues.filter((i: any) => i.severity === 'warning');
      
      if (errors.length > 0) {
        this.log('\n❌ Errors found:');
        for (const error of errors.slice(0, 5)) { // Show first 5 errors
          this.log(`  • ${error.message}`);
          if (error.filePath && this.options.verbose) {
            this.log(`    File: ${error.filePath}`);
          }
        }
        if (errors.length > 5) {
          this.log(`  ... and ${errors.length - 5} more errors`);
        }
      }
      
      if (warnings.length > 0 && this.options.verbose) {
        this.log('\n⚠️  Warnings found:');
        for (const warning of warnings.slice(0, 3)) { // Show first 3 warnings
          this.log(`  • ${warning.message}`);
        }
        if (warnings.length > 3) {
          this.log(`  ... and ${warnings.length - 3} more warnings`);
        }
      }
    }

    // Show XAML conversion results
    if (result.stats.filesWithXaml > 0) {
      this.log(`\n🔴 XAML Conversion Issue: ${result.stats.filesWithXaml} files still contain XAML content`);
      this.log('   This indicates the XAML-to-Markdown conversion may not be working properly.');
    } else if (result.stats.filesWithConvertedContent > 0) {
      this.log(`\n✅ XAML Conversion: ${result.stats.filesWithConvertedContent} files successfully converted`);
    }
  }

  /**
   * Get file organizer options for external access
   */
  public getFileOrganizerOptions() {
    return this.fileOrganizer.getOptions();
  }
}

/**
 * Parse command line arguments
 */
function parseCommandLine(): CLIOptions {
  const args = process.argv.slice(2);
  
  const parsed = parseArgs({
    args,
    options: {
      // Database options
      database: { type: 'string', short: 'd' },
      output: { type: 'string', short: 'o' },
      
      // Organization options
      'organize-notebooks': { type: 'boolean' },
      'date-folders': { type: 'boolean' },
      'index-files': { type: 'boolean' },
      
      // Markdown options
      frontmatter: { type: 'boolean' },
      metadata: { type: 'boolean' },
      dates: { type: 'boolean' },
      references: { type: 'boolean' },
      'notebook-info': { type: 'boolean' },
      'include-id': { type: 'boolean' },
      'date-format': { type: 'string' },
      
      // Processing options
      verbose: { type: 'boolean', short: 'v' },
      'dry-run': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean' },
    },
    allowPositionals: false,
  });

  const options: CLIOptions = {
    database: parsed.values.database,
    output: parsed.values.output,
    organizeByNotebooks: parsed.values['organize-notebooks'],
    includeDateFolders: parsed.values['date-folders'],
    createIndexFiles: parsed.values['index-files'],
    includeFrontmatter: parsed.values.frontmatter,
    includeMetadata: parsed.values.metadata,
    includeDates: parsed.values.dates,
    includeReferences: parsed.values.references,
    includeNotebook: parsed.values['notebook-info'],
    includeId: parsed.values['include-id'],
    dateFormat: parsed.values['date-format'] as 'iso' | 'locale' | 'short' | undefined,
    verbose: parsed.values.verbose,
    dryRun: parsed.values['dry-run'],
    help: parsed.values.help,
    version: parsed.values.version,
  };

  return options;
}

/**
 * Validate CLI options
 */
function validateOptions(options: CLIOptions): void {
  // Check database exists if provided
  if (options.database && !existsSync(options.database)) {
    console.error(`❌ Database file not found: ${options.database}`);
    process.exit(1);
  }

  // Validate date format
  if (options.dateFormat && !['iso', 'locale', 'short'].includes(options.dateFormat)) {
    console.error(`❌ Invalid date format: ${options.dateFormat}. Must be one of: iso, locale, short`);
    process.exit(1);
  }
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const options = parseCommandLine();

  // Handle help and version
  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (options.version) {
    // Would read from package.json in a real implementation
    console.log('Logos Notes Exporter v1.0.0');
    process.exit(0);
  }

  // Validate options
  validateOptions(options);

  // Create and run exporter
  const exporter = new LogosNotesExporter(options);
  await exporter.export();
}

// Run CLI if this file is executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { LogosNotesExporter, parseCommandLine, validateOptions }; 