#!/usr/bin/env bun
import { parseArgs } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { NotebookOrganizer } from './notebook-organizer.js';
import { FileOrganizer, DEFAULT_FILE_OPTIONS } from './file-organizer.js';
import { MarkdownConverter, DEFAULT_MARKDOWN_OPTIONS, type XamlConversionFailure } from './markdown-converter.js';
import type { FileStructureOptions, MarkdownOptions } from './types.js';
import { ExportValidator } from './validator.js';
import { NotesToolDatabase } from './notestool-database.js';
import { CatalogDatabase } from './catalog-database.js';

/**
 * Read version from package.json
 */
function getPackageVersion(): string {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    const packageContent = readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    return packageJson.version || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

interface CLIOptions {
  /** Database file path */
  database?: string;
  /** List available database locations */
  listDatabases?: boolean;
  /** Show database search instructions */
  showInstructions?: boolean;
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
  includeNotebook?: boolean;
  includeId?: boolean;
  dateFormat?: 'iso' | 'locale' | 'short';
  /** Processing options */
  skipHighlights?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  help?: boolean;
  version?: boolean;
}

const HELP_TEXT = `
Logos Notes Exporter - Convert Logos notes to Markdown

USAGE:
  LogosNotesExporter [OPTIONS]

OPTIONS:
  --database, -d        Path to NotesTool database file (auto-detected if not specified)
  --list-databases      List all available database locations and exit
  --show-instructions   Show manual database location instructions and exit
  --output, -o          Output directory (default: ./Logos-Exported-Notes)
  
  ORGANIZATION:
  --no-organize-notebooks  Disable organizing notes by notebooks (default: organize by notebooks)
  --date-folders           Create date-based subdirectories
  --skip-highlights        Skip highlight notes, export only text and annotation notes
  --no-index-files         Do not create README.md index files (default: create them)
  
  MARKDOWN:
  --no-frontmatter      Exclude YAML frontmatter (default: include)
  --show-metadata       Include metadata in markdown content (default: only shown in frontmatter)
  --no-dates            Exclude creation/modification dates (default: include)
  --no-notebook-info    Exclude notebook information (default: include)
  --include-id          Include note IDs
  --date-format         Date format: iso, locale, short (default: iso)
  
  PROCESSING:
  --verbose, -v         Verbose output
  --dry-run            Show what would be done without writing files
  --help, -h           Show this help
  --version            Show version

EXAMPLES:
  # Basic export (auto-finds database)
  LogosNotesExporter
  
  # List available database locations
  LogosNotesExporter --list-databases
  
  # Export with custom database
  LogosNotesExporter --database ./path/to/notestool.db
  
  # Custom output with date folders
  LogosNotesExporter -o ./my-notes --date-folders
  
  # Dry run to see what would be exported
  LogosNotesExporter --dry-run --verbose
  
  # Export without frontmatter and show metadata in content
  LogosNotesExporter --no-frontmatter --show-metadata

NOTES:
  - Database is auto-detected in standard Logos installation locations
  - Windows: %LOCALAPPDATA%\\Logos4\\Documents\\{random-id}\\NotesToolManager\\notestool.db
  - macOS: ~/Library/Application Support/Logos4/Documents/{random-id}/NotesToolManager/notestool.db
  - Use --list-databases to see all available locations
  - All database operations are READ-ONLY for safety
  - Output files will be organized by notebooks unless --no-organize-notebooks
  - Existing files will be overwritten
  - Bible references are always included when available
`;

class LogosNotesExporter {
  private database: NotesToolDatabase;
  private catalogDb?: CatalogDatabase;
  private organizer: NotebookOrganizer;
  private fileOrganizer: FileOrganizer;
  private markdownConverter: MarkdownConverter;
  private validator: ExportValidator;
  private options: CLIOptions;

  constructor(options: CLIOptions) {
    this.options = options;
    
    // Initialize database with automatic location detection
    this.database = new NotesToolDatabase(options.database);
    
    // Initialize catalog database for resource titles
    try {
      this.catalogDb = new CatalogDatabase(this.database.getDatabaseInfo().path);
      if (options.verbose) {
        const catalogInfo = this.catalogDb.getCatalogInfo();
        console.log(`📖 Using catalog database: ${catalogInfo.path}`);
        if (catalogInfo.size) {
          console.log(`   Size: ${(catalogInfo.size / 1024 / 1024).toFixed(1)} MB`);
        }
      }
    } catch (error) {
      if (options.verbose) {
        console.warn('⚠️  Catalog database not found or accessible. Resource titles will not be included.');
        console.warn('   Error:', error);
      }
    }
    
    this.organizer = new NotebookOrganizer(this.database, { skipHighlights: options.skipHighlights || false });
    
    // Show database info in verbose mode
    if (options.verbose) {
      const dbInfo = this.database.getDatabaseInfo();
      console.log(`📁 Using database: ${dbInfo.description}`);
      console.log(`   Path: ${dbInfo.path}`);
      if (dbInfo.size) {
        console.log(`   Size: ${(dbInfo.size / 1024 / 1024).toFixed(1)} MB`);
      }
      console.log('');
    }
    
    // Configure file organizer
    const fileOptions: Partial<FileStructureOptions> = {
      baseDir: options.output || './Logos-Exported-Notes',
      organizeByNotebooks: options.organizeByNotebooks !== false,
      includeDateFolders: options.includeDateFolders || false,
      createIndexFiles: options.createIndexFiles !== false,
    };
    
    // Get resourceIds for filename generation
    const resourceIds = this.database.getResourceIds();
    this.fileOrganizer = new FileOrganizer(fileOptions, resourceIds);
    
    // Configure markdown converter
    const markdownOptions: Partial<MarkdownOptions> = {
      includeFrontmatter: options.includeFrontmatter !== false,
      includeMetadata: options.includeMetadata || false,
      includeDates: options.includeDates !== false,
      includeNotebook: options.includeNotebook !== false,
      includeId: options.includeId || false,
      dateFormat: options.dateFormat || 'iso',
    };
    this.markdownConverter = new MarkdownConverter(markdownOptions, this.database, options.verbose || false, this.catalogDb);
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
        const notebookName = group.notebook?.title || 'No Notebook';
        this.log(`Processing: ${notebookName} (${group.notes.length} notes)`);

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

      // Step 7: Display Rich Text (XAML) conversion statistics
      this.log('\n📊 Rich Text (XAML) Conversion Statistics:');
      const xamlStats = this.markdownConverter.getXamlConversionStats();
      this.displayXamlStats(xamlStats);

      // Show detailed XAML conversion failures in verbose mode
      if (this.options.verbose && xamlStats.xamlConversionsFailed > 0) {
        this.displayXamlFailures();
      }

      // Step 8: Validate export (if enabled)
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
      if (this.catalogDb) {
        this.catalogDb.close();
      }
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
    this.log(`  Notes with No Notebook: ${stats.orphanedNotes}`);
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
      const notebookName = group.notebook?.title || 'No Notebook';
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
   * Display Rich Text (XAML) conversion statistics
   */
  private displayXamlStats(stats: any): void {
    this.log(`  Total notes processed: ${stats.totalNotes}`);
    this.log(`  Notes with Rich Text content: ${stats.notesWithXaml}`);
    this.log(`  Conversions succeeded: ${stats.xamlConversionsSucceeded}`);
    this.log(`  Conversion issues: ${stats.xamlConversionsFailed}`);
    this.log(`  Plain text notes: ${stats.plainTextNotes}`);
    this.log(`  Empty notes: ${stats.emptyNotes}`);
    
    if (stats.notesWithXaml > 0) {
      if (stats.xamlConversionsFailed > 0) {
        const failureRate = ((stats.xamlConversionsFailed / stats.notesWithXaml) * 100).toFixed(1);
        this.log(`\n⚠️  Rich Text (XAML) Conversion Issues:\n   ${stats.xamlConversionsFailed} out of ${stats.notesWithXaml} conversions had issues`);
      } else {
        this.log(`\n✅ Rich Text (XAML) Conversion: All ${stats.notesWithXaml} Rich Text Notes converted successfully`);
      }
    }
  }

  /**
   * Display detailed Rich Text (XAML) conversion failures in verbose mode
   */
  private displayXamlFailures(): void {
    const failures = this.markdownConverter.getXamlConversionFailures();
    
    if (failures.length === 0) {
      return;
    }

    this.log('\n🔍 Detailed Rich Text (XAML) Conversion Issues:');
    
    for (const failure of failures) {
      this.log(`\n❌ Note ID ${failure.noteId}: ${failure.noteTitle}`);
      
      if (failure.failureType === 'empty_content') {
        this.log(`   Issue: Rich Text (XAML) conversion succeeded but produced empty content`);
      } else {
        this.log(`   Issue: Exception during Rich Text (XAML) conversion`);
        if (failure.errorMessage) {
          this.log(`   Error: ${failure.errorMessage}`);
        }
      }
      
      this.log(`   XAML preview: ${failure.xamlContentPreview}${failure.xamlContentPreview.length >= 150 ? '...' : ''}`);
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
      const info = result.issues.filter((i: any) => i.severity === 'info');
      
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
      
      if (info.length > 0 && this.options.verbose) {
        this.log('\n💡 Info:');
        for (const infoItem of info.slice(0, 3)) { // Show first 3 info items
          this.log(`  • ${infoItem.message}`);
        }
        if (info.length > 3) {
          this.log(`  ... and ${info.length - 3} more info items`);
        }
      }
    }

    // Note: Rich Text (XAML) conversion statistics are displayed separately
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
      'list-databases': { type: 'boolean' },
      'show-instructions': { type: 'boolean' },
      output: { type: 'string', short: 'o' },
      
      // Organization options
      'no-organize-notebooks': { type: 'boolean' },
      'date-folders': { type: 'boolean' },
      'no-index-files': { type: 'boolean' },
      
      // Markdown options
      'no-frontmatter': { type: 'boolean' },
      'show-metadata': { type: 'boolean' },
      'no-dates': { type: 'boolean' },
      'no-notebook-info': { type: 'boolean' },
      'include-id': { type: 'boolean' },
      'date-format': { type: 'string' },
      
      // Processing options
      'skip-highlights': { type: 'boolean' },
      verbose: { type: 'boolean', short: 'v' },
      'dry-run': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean' },
    },
    allowPositionals: false,
  });

  const options: CLIOptions = {
    database: parsed.values.database,
    listDatabases: parsed.values['list-databases'],
    showInstructions: parsed.values['show-instructions'],
    output: parsed.values.output,
    organizeByNotebooks: !parsed.values['no-organize-notebooks'],
    includeDateFolders: parsed.values['date-folders'],
    createIndexFiles: !parsed.values['no-index-files'],
    includeFrontmatter: !parsed.values['no-frontmatter'],
    includeMetadata: parsed.values['show-metadata'],
    includeDates: !parsed.values['no-dates'],
    includeNotebook: !parsed.values['no-notebook-info'],
    includeId: parsed.values['include-id'],
    dateFormat: parsed.values['date-format'] as 'iso' | 'locale' | 'short' | undefined,
    skipHighlights: parsed.values['skip-highlights'],
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
    const version = getPackageVersion();
    console.log(`Logos Notes Exporter v${version}`);
    process.exit(0);
  }

  // Handle database discovery commands
  if (options.listDatabases) {
    const locations = NotesToolDatabase.displayAvailableLocations();
    console.log(locations.join('\n'));
    process.exit(0);
  }

  if (options.showInstructions) {
    const instructions = NotesToolDatabase.getSearchInstructions();
    console.log(instructions.join('\n'));
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

export { LogosNotesExporter, parseCommandLine, validateOptions, main }; 