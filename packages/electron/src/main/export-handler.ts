import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { ExportSettings, ExportProgress, ExportResult } from '../renderer/types';
import { 
  LogosNotesExporter,
  DatabaseLocator,
  type CoreExportOptions,
  type ExportCallbacks
} from '@logos-notes-exporter/core';

/**
 * Validates export settings before starting export
 */
function validateExportSettings(settings: ExportSettings): { valid: boolean; error?: string } {
  // Check if databasePath exists and is valid
  if (!settings.databasePath || typeof settings.databasePath !== 'string') {
    return { valid: false, error: 'Database path is required' };
  }

  if (!fs.existsSync(settings.databasePath)) {
    return { valid: false, error: `Database file not found: ${settings.databasePath}` };
  }

  // Check if outputDirectory exists and is a valid string
  if (!settings.outputDirectory || typeof settings.outputDirectory !== 'string' || settings.outputDirectory.trim() === '') {
    return { valid: false, error: 'Output directory is required' };
  }

  try {
    // Safely handle the tilde expansion
    const expandedPath = settings.outputDirectory.replace(/^~/, process.env.HOME || '');
    const outputPath = path.resolve(expandedPath);
    
    // Try to create output directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
  } catch (error) {
    return { valid: false, error: `Cannot create output directory: ${error.message}` };
  }

  return { valid: true };
}

/**
 * Detect available database locations using the core library
 */
export function detectDatabaseLocations(): string[] {
  try {
    const locations = DatabaseLocator.findDatabases();
    return locations
      .filter(loc => loc.exists)
      .map(loc => loc.path);
  } catch (error) {
    console.error('Error detecting database locations:', error);
    return [];
  }
}

/**
 * Get the best database location (first existing one)
 */
export function getDefaultDatabasePath(): string | null {
  try {
    const location = DatabaseLocator.getBestDatabase();
    return location ? location.path : null;
  } catch (error) {
    console.error('Error getting default database path:', error);
    return null;
  }
}

/**
 * Get database search instructions for manual location
 */
export function getDatabaseSearchInstructions(): string[] {
  try {
    return DatabaseLocator.getSearchInstructions();
  } catch (error) {
    console.error('Error getting database instructions:', error);
    return ['Error getting database instructions'];
  }
}

/**
 * Main export function that orchestrates the export process
 */
export async function executeExport(
  settings: ExportSettings,
  mainWindow: BrowserWindow | null
): Promise<ExportResult> {
  // Add debugging to see what we're receiving
  console.log('Export settings received:', {
    databasePath: settings.databasePath,
    outputDirectory: settings.outputDirectory,
    autoDetectDatabase: settings.autoDetectDatabase
  });

  // If no database path provided, try auto-detection
  let finalDatabasePath = settings.databasePath;
  if (!finalDatabasePath) {
    console.log('No database path provided, attempting auto-detection...');
    finalDatabasePath = getDefaultDatabasePath();
    if (finalDatabasePath) {
      console.log('Auto-detected database:', finalDatabasePath);
      if (mainWindow) {
        mainWindow.webContents.send('output-log', `🔍 Auto-detected database: ${finalDatabasePath}`);
      }
    }
  }

  // Update settings with the final database path
  const updatedSettings = {
    ...settings,
    databasePath: finalDatabasePath
  };

  // Validate settings
  const validation = validateExportSettings(updatedSettings);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Convert Electron ExportSettings to Core ExportOptions
  const coreOptions: CoreExportOptions = {
    database: updatedSettings.databasePath,
    output: updatedSettings.outputDirectory,
    organizeByNotebooks: updatedSettings.organizeByNotebooks,
    includeDateFolders: updatedSettings.includeDateFolders,
    createIndexFiles: updatedSettings.createIndexFiles,
    includeFrontmatter: updatedSettings.includeFrontmatter,
    includeMetadata: updatedSettings.includeMetadata,
    includeDates: updatedSettings.includeDates,
    includeNotebook: updatedSettings.includeNotebook,
    includeId: updatedSettings.includeId,
    dateFormat: updatedSettings.dateFormat,
    skipHighlights: updatedSettings.skipHighlights,
    verbose: false, // Not verbose by default for Electron
    dryRun: updatedSettings.dryRun,
  };

  console.log('Core options being passed:', {
    database: coreOptions.database,
    output: coreOptions.output
  });

  // Create callbacks for Electron IPC communication
  const callbacks: ExportCallbacks = {
    onProgress: (progress: number, message: string) => {
      if (mainWindow) {
        mainWindow.webContents.send('export-progress', { progress, message });
      }
    },
    onLog: (message: string) => {
      if (mainWindow) {
        mainWindow.webContents.send('output-log', message);
      }
    }
  };

  // Create and run the core exporter
  const exporter = new LogosNotesExporter(coreOptions, callbacks);
  const result = await exporter.export();

  // Convert core result to Electron result format
  return {
    success: result.success,
    outputPath: result.outputPath,
    error: result.error
  };
} 