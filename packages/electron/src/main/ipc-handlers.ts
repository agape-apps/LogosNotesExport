import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { ExportSettings, ExportProgress, ExportResult, AppMode } from '../renderer/types';
import { loadSettings, saveSettings, resetSettings } from './settings';
import { executeExport, detectDatabaseLocations, getDefaultDatabasePath, getDatabaseSearchInstructions } from './export-handler';

let exportInProgress = false;
let exportProcess: any = null; // Will be used when we integrate with core

/**
 * Sets up all IPC handlers for communication with renderer process
 */
export function setupIpcHandlers(): void {
  // Settings operations
  ipcMain.handle('load-settings', async () => {
    try {
      return loadSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  });

  ipcMain.handle('save-settings', async (_, settings: ExportSettings) => {
    try {
      // Get current mode and window size from settings or defaults
      const currentSettings = loadSettings();
      saveSettings(settings, currentSettings.mode, currentSettings.windowSize);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  });

  ipcMain.handle('restore-defaults', async () => {
    try {
      resetSettings();
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (mainWindow) {
        mainWindow.webContents.send('settings-loaded', loadSettings());
      }
    } catch (error) {
      console.error('Error restoring defaults:', error);
      throw error;
    }
  });

  // File system operations
  ipcMain.handle('select-output-directory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Output Directory',
        properties: ['openDirectory', 'createDirectory']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      console.error('Error selecting output directory:', error);
      return null;
    }
  });

  ipcMain.handle('open-output-folder', async (_, folderPath: string) => {
    try {
      if (fs.existsSync(folderPath)) {
        await shell.openPath(folderPath);
      } else {
        throw new Error('Folder does not exist');
      }
    } catch (error) {
      console.error('Error opening output folder:', error);
      throw error;
    }
  });

  // Database operations
  ipcMain.handle('detect-database', async () => {
    try {
      const defaultPath = getDefaultDatabasePath();
      if (defaultPath) {
        const mainWindow = BrowserWindow.getFocusedWindow();
        if (mainWindow) {
          mainWindow.webContents.send('database-detected', defaultPath);
        }
      }
      return defaultPath;
    } catch (error) {
      console.error('Error detecting database:', error);
      return null;
    }
  });

  // File selection operations
  ipcMain.handle('select-database', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Logos Database File',
        filters: [
          { name: 'SQLite Database', extensions: ['db'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        
        // Validate that this is likely a notestool database
        if (path.basename(selectedPath) === 'notestool.db') {
          return selectedPath;
        } else {
          // Show warning but allow selection
          const mainWindow = BrowserWindow.getFocusedWindow();
          if (mainWindow) {
            mainWindow.webContents.send('output-log', '⚠️ Selected file may not be a Logos NotesTool database');
          }
          return selectedPath;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error selecting database:', error);
      throw error;
    }
  });

  // Export operations
  ipcMain.handle('start-export', async (_, settings: ExportSettings) => {
    if (exportInProgress) {
      throw new Error('Export already in progress');
    }

    try {
      exportInProgress = true;
      const mainWindow = BrowserWindow.getFocusedWindow();
      
      if (mainWindow) {
        mainWindow.webContents.send('output-log', '🚀 Starting export...');
        
        // Send initial progress
        const progress: ExportProgress = { progress: 0, message: 'Initializing export...' };
        mainWindow.webContents.send('export-progress', progress);
      }

      // Execute export using the export handler
      const result = await executeExport(settings, mainWindow);
      
      if (mainWindow) {
        mainWindow.webContents.send('export-complete', result);
      }
      
    } catch (error) {
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (mainWindow) {
        mainWindow.webContents.send('export-error', error.message);
        mainWindow.webContents.send('output-log', `❌ Export failed: ${error.message}`);
      }
      throw error;
    } finally {
      exportInProgress = false;
      exportProcess = null;
    }
  });

  ipcMain.handle('cancel-export', async () => {
    if (!exportInProgress) {
      return;
    }

    try {
      if (exportProcess && exportProcess.kill) {
        exportProcess.kill();
      }
      
      exportInProgress = false;
      exportProcess = null;
      
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (mainWindow) {
        mainWindow.webContents.send('output-log', '🛑 Export cancelled by user');
        
        const result: ExportResult = {
          success: false,
          error: 'Export cancelled by user'
        };
        mainWindow.webContents.send('export-complete', result);
      }
    } catch (error) {
      console.error('Error cancelling export:', error);
      throw error;
    }
  });
}

/**
 * Detects Logos database files on the system
 */
async function detectLogosDatabase(): Promise<string | null> {
  // Platform-specific search paths for Logos databases
  const searchPaths: string[] = [];
  
  if (process.platform === 'win32') {
    // Windows paths
    const userProfile = process.env.USERPROFILE || '';
    searchPaths.push(
      path.join(userProfile, 'Documents', 'Logos', 'Data'),
      path.join(userProfile, 'AppData', 'Local', 'Logos', 'Data'),
      path.join(userProfile, 'AppData', 'Roaming', 'Logos', 'Data')
    );
  } else if (process.platform === 'darwin') {
    // macOS paths
    const homeDir = process.env.HOME || '';
    searchPaths.push(
      path.join(homeDir, 'Documents', 'Logos', 'Data'),
      path.join(homeDir, 'Library', 'Application Support', 'Logos', 'Data'),
      path.join(homeDir, 'Logos', 'Data')
    );
  }

  // Search for database files
  for (const searchPath of searchPaths) {
    try {
      if (fs.existsSync(searchPath)) {
        const files = fs.readdirSync(searchPath);
        const dbFiles = files.filter(file => 
          file.toLowerCase().includes('notes') && 
          (file.endsWith('.db') || file.endsWith('.sqlite') || file.endsWith('.sqlite3'))
        );
        
        if (dbFiles.length > 0) {
          return path.join(searchPath, dbFiles[0]);
        }
      }
    } catch (error) {
      // Continue searching in other paths
      continue;
    }
  }

  return null;
}

 