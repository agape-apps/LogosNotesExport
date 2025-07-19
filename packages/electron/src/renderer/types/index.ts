// Export Settings Types
export interface ExportSettings {
  // Database
  databasePath?: string;
  autoDetectDatabase: boolean;

  // Output
  outputDirectory: string;
  organizeByNotebooks: boolean;
  includeDateFolders: boolean;
  createIndexFiles: boolean;
  skipHighlights: boolean;

  // Markdown
  includeFrontmatter: boolean;
  includeMetadata: boolean;
  includeDates: boolean;
  includeNotebook: boolean;
  includeId: boolean;
  dateFormat: "iso" | "locale" | "short";

  // Processing
  htmlSubSuperscript: boolean;
  dryRun: boolean;
}

// Application State Types
export type AppMode = "basic" | "advanced";

export interface AppState {
  mode: AppMode;
  settings: ExportSettings;
  isExporting: boolean;
  exportProgress: number;
  exportMessage: string;
  outputPath?: string;
  lastExportSuccess: boolean;
}

// Export Status Types
export interface ExportProgress {
  progress: number;
  message: string;
}

export interface ExportResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

// IPC Communication Types

// Main → Renderer Events
export interface MainToRenderer {
  "export-progress": (progress: ExportProgress) => void;
  "export-complete": (result: ExportResult) => void;
  "export-error": (error: string) => void;
  "settings-loaded": (settings: ExportSettings) => void;
  "database-detected": (path: string) => void;
  "output-log": (message: string) => void;
}

// Renderer → Main Events
export interface RendererToMain {
  "start-export": (settings: ExportSettings) => void;
  "cancel-export": () => void;
  "select-database": () => Promise<string | null>;
  "select-output-directory": () => Promise<string | null>;
  "open-output-folder": (path: string) => void;
  "save-settings": (settings: ExportSettings) => void;
  "load-settings": () => void;
  "restore-defaults": () => void;
  "detect-database": () => void;
}

// Settings Persistence Types
export interface SettingsFile {
  version: string;
  database: {
    autoDetect: boolean;
    customPath?: string;
  };
  output: {
    directory: string;
    organizeByNotebooks: boolean;
    includeDateFolders: boolean;
    createIndexFiles: boolean;
    skipHighlights: boolean;
  };
  markdown: {
    includeFrontmatter: boolean;
    includeMetadata: boolean;
    includeDates: boolean;
    includeNotebook: boolean;
    includeId: boolean;
    dateFormat: "iso" | "locale" | "short";
  };
  processing: {
    htmlSubSuperscript: boolean;
    dryRun: boolean;
  };
  ui: {
    mode: AppMode;
    windowSize: {
      width: number;
      height: number;
    };
  };
}

// Default Settings
export const DEFAULT_SETTINGS: ExportSettings = {
  autoDetectDatabase: true,
  outputDirectory: "~/Documents/Logos-Exported-Notes",
  organizeByNotebooks: true,
  includeDateFolders: false,
  createIndexFiles: true,
  skipHighlights: true,
  includeFrontmatter: true,
  includeMetadata: false,
  includeDates: true,
  includeNotebook: true,
  includeId: false,
  dateFormat: "iso",
  htmlSubSuperscript: false,
  dryRun: false,
};

export const DEFAULT_APP_STATE: AppState = {
  mode: "basic",
  settings: DEFAULT_SETTINGS,
  isExporting: false,
  exportProgress: 0,
  exportMessage: "Ready to export...",
  lastExportSuccess: false,
}; 