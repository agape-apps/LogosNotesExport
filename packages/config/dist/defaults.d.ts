/**
 * Central Configuration Module - Single Source of Truth for Default Settings
 *
 * This module centralizes all default settings to eliminate duplication across
 * CLI, Electron, and core packages. Any new settings should be added here first.
 */
export declare const DEFAULT_CONFIG: {
    /** XAML to Markdown conversion settings */
    readonly xaml: {
        /** Font sizes that correspond to heading levels [H1, H2, H3, H4, H5, H6] */
        readonly headingSizes: number[];
        /** Font family name used to identify code elements */
        readonly monospaceFontName: "Courier New";
        /** Left border thickness for block quotes */
        readonly blockQuoteLineThickness: 3;
        /** Top border thickness for horizontal rules */
        readonly horizontalLineThickness: 3;
        /** Whether to ignore unknown elements */
        readonly ignoreUnknownElements: true;
        /** Use HTML sub/superscript tags instead of Pandoc-style formatting */
        readonly htmlSubSuperscript: false;
    };
    /** Markdown generation settings */
    readonly markdown: {
        /** Include YAML frontmatter */
        readonly includeFrontmatter: true;
        /** Include note metadata in content */
        readonly includeMetadata: false;
        /** Include creation/modification dates */
        readonly includeDates: true;
        /** Include note kind/type */
        readonly includeKind: true;
        /** Include notebook information */
        readonly includeNotebook: true;
        /** Custom frontmatter fields */
        readonly customFields: Record<string, unknown>;
        /** Date format for display */
        readonly dateFormat: "iso";
        /** Whether to include note ID */
        readonly includeId: false;
        /** Use HTML sub/superscript tags instead of Pandoc-style formatting */
        readonly htmlSubSuperscript: false;
    };
    /** File organization and export settings */
    readonly export: {
        /** Auto-detect database location */
        readonly autoDetectDatabase: true;
        /** Default output directory */
        readonly outputDirectory: "~/Documents/Logos-Exported-Notes";
        /** Organize notes by notebooks */
        readonly organizeByNotebooks: true;
        /** Create date-based subdirectories */
        readonly includeDateFolders: false;
        /** Create README.md index files */
        readonly createIndexFiles: true;
        /** Skip highlight notes, export only text and annotation notes */
        readonly skipHighlights: true;
        /** Preview mode - don't write files */
        readonly dryRun: false;
    };
    /** UI and application settings */
    readonly ui: {
        /** Default application mode */
        readonly mode: "basic";
        /** Default window dimensions */
        readonly windowSize: {
            readonly width: 900;
            readonly height: 700;
        };
    };
};
/** Type-safe access to nested config values */
export type ConfigPath = {
    xaml: typeof DEFAULT_CONFIG.xaml;
    markdown: typeof DEFAULT_CONFIG.markdown;
    export: typeof DEFAULT_CONFIG.export;
    ui: typeof DEFAULT_CONFIG.ui;
};
/** Helper function to get default values for specific categories */
export declare const getDefaults: {
    readonly xaml: () => {
        headingSizes: number[];
        monospaceFontName: "Courier New";
        blockQuoteLineThickness: 3;
        horizontalLineThickness: 3;
        ignoreUnknownElements: true;
        htmlSubSuperscript: false;
    };
    readonly markdown: () => {
        includeFrontmatter: true;
        includeMetadata: false;
        includeDates: true;
        includeKind: true;
        includeNotebook: true;
        customFields: Record<string, unknown>;
        dateFormat: "iso";
        includeId: false;
        htmlSubSuperscript: false;
    };
    readonly export: () => {
        autoDetectDatabase: true;
        outputDirectory: "~/Documents/Logos-Exported-Notes";
        organizeByNotebooks: true;
        includeDateFolders: false;
        createIndexFiles: true;
        skipHighlights: true;
        dryRun: false;
    };
    readonly ui: () => {
        mode: "basic";
        windowSize: {
            readonly width: 900;
            readonly height: 700;
        };
    };
    readonly all: () => {
        xaml: {
            /** Font sizes that correspond to heading levels [H1, H2, H3, H4, H5, H6] */
            readonly headingSizes: number[];
            /** Font family name used to identify code elements */
            readonly monospaceFontName: "Courier New";
            /** Left border thickness for block quotes */
            readonly blockQuoteLineThickness: 3;
            /** Top border thickness for horizontal rules */
            readonly horizontalLineThickness: 3;
            /** Whether to ignore unknown elements */
            readonly ignoreUnknownElements: true;
            /** Use HTML sub/superscript tags instead of Pandoc-style formatting */
            readonly htmlSubSuperscript: false;
        };
        markdown: {
            /** Include YAML frontmatter */
            readonly includeFrontmatter: true;
            /** Include note metadata in content */
            readonly includeMetadata: false;
            /** Include creation/modification dates */
            readonly includeDates: true;
            /** Include note kind/type */
            readonly includeKind: true;
            /** Include notebook information */
            readonly includeNotebook: true;
            /** Custom frontmatter fields */
            readonly customFields: Record<string, unknown>;
            /** Date format for display */
            readonly dateFormat: "iso";
            /** Whether to include note ID */
            readonly includeId: false;
            /** Use HTML sub/superscript tags instead of Pandoc-style formatting */
            readonly htmlSubSuperscript: false;
        };
        export: {
            /** Auto-detect database location */
            readonly autoDetectDatabase: true;
            /** Default output directory */
            readonly outputDirectory: "~/Documents/Logos-Exported-Notes";
            /** Organize notes by notebooks */
            readonly organizeByNotebooks: true;
            /** Create date-based subdirectories */
            readonly includeDateFolders: false;
            /** Create README.md index files */
            readonly createIndexFiles: true;
            /** Skip highlight notes, export only text and annotation notes */
            readonly skipHighlights: true;
            /** Preview mode - don't write files */
            readonly dryRun: false;
        };
        ui: {
            /** Default application mode */
            readonly mode: "basic";
            /** Default window dimensions */
            readonly windowSize: {
                readonly width: 900;
                readonly height: 700;
            };
        };
    };
};
//# sourceMappingURL=defaults.d.ts.map