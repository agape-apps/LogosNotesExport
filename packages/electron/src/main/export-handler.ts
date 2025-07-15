import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { ExportSettings, ExportProgress, ExportResult } from '../renderer/types';

// TODO: Import from @logos-notes-exporter/core when ready
// For now, we'll create placeholder types and functions
interface CoreExportOptions {
  databasePath: string;
  outputPath: string;
  organizeByNotebooks?: boolean;
  includeDateFolders?: boolean;
  createIndexFiles?: boolean;
  skipHighlights?: boolean;
  includeFrontmatter?: boolean;
  includeMetadata?: boolean;
  includeDates?: boolean;
  includeNotebook?: boolean;
  includeId?: boolean;
  dateFormat?: "iso" | "locale" | "short";
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Converts Electron ExportSettings to Core library options
 */
function convertSettingsToCoreOptions(settings: ExportSettings): CoreExportOptions {
  return {
    databasePath: settings.databasePath || '',
    outputPath: settings.outputDirectory,
    organizeByNotebooks: settings.organizeByNotebooks,
    includeDateFolders: settings.includeDateFolders,
    createIndexFiles: settings.createIndexFiles,
    skipHighlights: settings.skipHighlights,
    includeFrontmatter: settings.includeFrontmatter,
    includeMetadata: settings.includeMetadata,
    includeDates: settings.includeDates,
    includeNotebook: settings.includeNotebook,
    includeId: settings.includeId,
    dateFormat: settings.dateFormat,
    dryRun: settings.dryRun,
    verbose: false, // Regular mode by default
  };
}

/**
 * Validates export settings before starting export
 */
function validateExportSettings(settings: ExportSettings): { valid: boolean; error?: string } {
  // Check database path
  if (!settings.databasePath) {
    return { valid: false, error: 'Database path is required. Please select a database file.' };
  }

  if (!fs.existsSync(settings.databasePath)) {
    return { valid: false, error: 'Database file does not exist. Please select a valid database file.' };
  }

  // Check output directory
  if (!settings.outputDirectory) {
    return { valid: false, error: 'Output directory is required. Please select an output directory.' };
  }

  // Ensure output directory exists or can be created
  try {
    const outputDir = path.resolve(settings.outputDirectory.replace(/^~/, process.env.HOME || ''));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  } catch (error) {
    return { valid: false, error: `Cannot create output directory: ${error.message}` };
  }

  return { valid: true };
}

/**
 * Creates a progress callback function that sends updates to the renderer
 */
function createProgressCallback(mainWindow: BrowserWindow) {
  return (progress: number, message: string) => {
    const progressData: ExportProgress = { progress, message };
    mainWindow.webContents.send('export-progress', progressData);
    mainWindow.webContents.send('output-log', `📋 ${message}`);
  };
}

/**
 * Creates a logging callback function that sends log messages to the renderer
 */
function createLogCallback(mainWindow: BrowserWindow) {
  return (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    let emoji = '📋';
    switch (level) {
      case 'warn':
        emoji = '⚠️';
        break;
      case 'error':
        emoji = '❌';
        break;
      default:
        emoji = '📋';
    }
    mainWindow.webContents.send('output-log', `${emoji} ${message}`);
  };
}

/**
 * Main export function that orchestrates the export process
 */
export async function executeExport(
  settings: ExportSettings,
  mainWindow: BrowserWindow
): Promise<ExportResult> {
  // Validate settings
  const validation = validateExportSettings(settings);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const progressCallback = createProgressCallback(mainWindow);
  const logCallback = createLogCallback(mainWindow);
  
  try {
    logCallback('🚀 Starting export process...');
    progressCallback(0, 'Initializing export...');

    // Convert settings to core format
    const coreOptions = convertSettingsToCoreOptions(settings);
    
    // Resolve output path
    const outputPath = path.resolve(coreOptions.outputPath.replace(/^~/, process.env.HOME || ''));
    coreOptions.outputPath = outputPath;

    logCallback(`📂 Database: ${coreOptions.databasePath}`);
    logCallback(`📁 Output: ${outputPath}`);
    
    if (settings.dryRun) {
      logCallback('🧪 Running in dry-run mode...');
    }

    // TODO: Replace this simulation with actual core library integration
    // Example integration would look like:
    /*
    import { exportNotes } from '@logos-notes-exporter/core';
    
    const result = await exportNotes(coreOptions, {
      onProgress: progressCallback,
      onLog: logCallback,
    });
    */

    // Simulate export process for now
    await simulateExportWithCore(coreOptions, progressCallback, logCallback);

    logCallback('✅ Export completed successfully!');
    
    return {
      success: true,
      outputPath: outputPath,
    };

  } catch (error) {
    logCallback(`Export failed: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Simulates the export process using the core library interface
 * This will be replaced with actual core integration
 */
async function simulateExportWithCore(
  options: CoreExportOptions,
  progressCallback: (progress: number, message: string) => void,
  logCallback: (message: string, level?: 'info' | 'warn' | 'error') => void
): Promise<void> {
  const steps = [
    { progress: 10, message: 'Connecting to database...', delay: 500 },
    { progress: 25, message: 'Reading notes data...', delay: 800 },
    { progress: 45, message: 'Converting XAML to Markdown...', delay: 1200 },
    { progress: 65, message: 'Processing references...', delay: 600 },
    { progress: 80, message: 'Creating output files...', delay: 900 },
    { progress: 95, message: 'Organizing by notebooks...', delay: 400 },
    { progress: 100, message: 'Finalizing export...', delay: 300 },
  ];

  for (const step of steps) {
    progressCallback(step.progress, step.message);
    
    // Add some detailed logging
    if (step.progress === 25) {
      logCallback(`Found ${Math.floor(Math.random() * 500) + 50} notes to export`);
    } else if (step.progress === 45) {
      logCallback(`Processing XAML content...`);
    } else if (step.progress === 80) {
      if (options.organizeByNotebooks) {
        logCallback(`Creating notebook-based folder structure`);
      }
      if (options.createIndexFiles) {
        logCallback(`Generating index files`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, step.delay));
  }

  // Create a test output file to show something was created
  try {
    if (!options.dryRun) {
      const testFile = path.join(options.outputPath, 'export-info.md');
      const content = `# Export Information

- Export Date: ${new Date().toISOString()}
- Database: ${options.databasePath}
- Settings: ${JSON.stringify(options, null, 2)}

This is a test export from the Electron app.
`;
      
      await fs.promises.writeFile(testFile, content, 'utf8');
      logCallback(`Created test file: ${testFile}`);
    } else {
      logCallback('Dry run completed - no files were created');
    }
  } catch (error) {
    logCallback(`Warning: Could not create test file: ${error.message}`, 'warn');
  }
} 