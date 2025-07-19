/**
 * Central Configuration Module - Single Source of Truth for Default Settings
 * 
 * This module centralizes all default settings to eliminate duplication across
 * CLI, Electron, and core packages. Any new settings should be added here first.
 */

export const DEFAULT_CONFIG = {
  /** XAML to Markdown conversion settings */
  xaml: {
    /** Font sizes that correspond to heading levels [H1, H2, H3, H4, H5, H6] */
    headingSizes: [] as number[], // No longer used - we use ranges instead
    /** Font family name used to identify code elements */
    monospaceFontName: 'Courier New',
    /** Left border thickness for block quotes */
    blockQuoteLineThickness: 3,
    /** Top border thickness for horizontal rules */
    horizontalLineThickness: 3,
    /** Whether to ignore unknown elements */
    ignoreUnknownElements: true,
    /** Use HTML sub/superscript tags instead of Pandoc-style formatting */
    htmlSubSuperscript: false,
  },

  /** Markdown generation settings */
  markdown: {
    /** Include YAML frontmatter */
    includeFrontmatter: true,
    /** Include note metadata in content */
    includeMetadata: false,
    /** Include creation/modification dates */
    includeDates: true,
    /** Include note kind/type */
    includeKind: true,
    /** Include notebook information */
    includeNotebook: true,
    /** Custom frontmatter fields */
    customFields: {} as Record<string, unknown>,
    /** Date format for display */
    dateFormat: 'iso' as const,
    /** Whether to include note ID */
    includeId: false,
    /** Use HTML sub/superscript tags instead of Pandoc-style formatting */
    htmlSubSuperscript: false,
  },

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

/** Type-safe access to nested config values */
export type ConfigPath = {
  xaml: typeof DEFAULT_CONFIG.xaml;
  markdown: typeof DEFAULT_CONFIG.markdown;
  export: typeof DEFAULT_CONFIG.export;
  ui: typeof DEFAULT_CONFIG.ui;
};

/** Helper function to get default values for specific categories */
export const getDefaults = {
  xaml: () => ({ ...DEFAULT_CONFIG.xaml }),
  markdown: () => ({ ...DEFAULT_CONFIG.markdown }),
  export: () => ({ ...DEFAULT_CONFIG.export }),
  ui: () => ({ ...DEFAULT_CONFIG.ui }),
  all: () => ({ ...DEFAULT_CONFIG }),
} as const; 