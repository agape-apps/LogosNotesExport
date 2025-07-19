/**
 * Electron Renderer Default Configuration
 * 
 * Local copy of default settings to avoid importing core package in renderer process.
 * This prevents webpack from trying to bundle Node.js modules for the browser environment.
 */

export const ELECTRON_DEFAULT_CONFIG = {
  /** File organization and export settings */
  export: {
    /** Auto-detect database location */
    autoDetectDatabase: true,
    /** Default output directory */
    outputDirectory: '~/Documents/Logos-Exported-Notes',
    /** Organize notes by notebooks */
    organizeByNotebooks: true,
    /** Create date-based subdirectories */
    includeDateFolders: false,
    /** Create README.md index files */
    createIndexFiles: true,
    /** Skip highlight notes, export only text and annotation notes */
    skipHighlights: true,
    /** Preview mode - don't write files */
    dryRun: false,
  },

  /** Markdown generation settings */
  markdown: {
    /** Include YAML frontmatter */
    includeFrontmatter: true,
    /** Include note metadata in content */
    includeMetadata: false,
    /** Include creation/modification dates */
    includeDates: true,
    /** Include notebook information */
    includeNotebook: true,
    /** Whether to include note ID */
    includeId: false,
    /** Date format for display */
    dateFormat: 'iso' as const,
    /** Use HTML sub/superscript tags instead of Pandoc-style formatting */
    htmlSubSuperscript: false,
  },

  /** UI and application settings */
  ui: {
    /** Default application mode */
    mode: 'basic' as const,
    /** Default window dimensions */
    windowSize: {
      width: 900,
      height: 700,
    },
  },
} as const; 