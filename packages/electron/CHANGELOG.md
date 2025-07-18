# Changelog (ONLY APPEND TO THE END, NEVER REMOVE OR CHANGE CONTENT)
- one line per update (100 to 200 characters)

2025-07-15 feat: Complete Phase 1 core integration and implement Phase 2 Basic Mode UI with real export functionality
- Replaced simulated export with real core library integration using NotebookOrganizer, FileOrganizer, MarkdownConverter, and CatalogDatabase classes
- Implemented auto database detection using DatabaseLocator.findDatabases() and DatabaseLocator.getBestDatabase() methods  
- Created complete Basic Mode UI with left/right column layout featuring export controls and real-time output log display
- Added missing ShadcnUI components (checkbox, select, switch, tooltip, alert, dialog) for future Advanced mode implementation
- Integrated Zustand store with IPC communication for proper state management between main and renderer processes
- Implemented functional Export Notes button with real-time progress tracking and XAML conversion statistics
- Added Open Notes Folder button that enables after successful export completion
- Created comprehensive error handling and user feedback using toast notifications and detailed logging
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024)

2025-07-15 (Refactoring) refactor: Move main export logic from CLI to unified core LogosNotesExporter class for code reuse
- Created new LogosNotesExporter class in packages/core/src/exporter.ts with configurable logging and progress callbacks
- Refactored CLI to use the unified core exporter instead of duplicated logic
- Updated Electron export-handler.ts to use the same core exporter with IPC callbacks
- Added database adapter (database-adapter.ts) to handle bun:sqlite compatibility in Electron webpack environment
- Configured webpack alias to map bun:sqlite to better-sqlite3 adapter for Electron builds
- Both CLI and Electron now use identical export logic from core, ensuring consistency and reducing maintenance overhead
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024) 

2025-07-15 - Fix React hooks and type compatibility errors, resolve bun:sqlite webpack issues for successful Electron app launch
- Fixed bun:sqlite webpack resolution using NormalModuleReplacementPlugin instead of aliases
- Created database-adapter.ts wrapper for better-sqlite3 to provide bun:sqlite compatibility
- Downgraded React from v19 to v18 (^18.3.1) to fix useSyncExternalStore hooks compatibility with Zustand
- Downgraded @types/react and @types/react-dom to v18 compatible versions (^18.3.12, ^18.3.1)
- Downgraded Radix UI packages to React 18 compatible versions to fix TypeScript type conflicts
- Resolved port 9000 conflicts that were preventing app startup
- Verified successful Electron app launch with all core export functionality working
- Exact LLM Model string: Claude 3.5 Sonnet (Anthropic, 2024) 

2024-10-29: Fixed better-sqlite3 module version mismatch by rebuilding for Electron and resolving build dependencies. 

2025-07-18 fix: Comprehensive type safety improvements and code cleanup to eliminate any types and unused code
- Replaced any types in database-adapter.ts with proper better-sqlite3 TypeScript types (unknown[], BetterSqlite3.Statement, BetterSqlite3.RunResult)
- Fixed exportProcess type from any to ChildProcess | null for proper Node.js process typing in ipc-handlers.ts
- Resolved @/lib/utils path resolution errors in UI components by configuring eslint-import-resolver-typescript
- Removed unused imports: ExportProgress, detectDatabaseLocations, getDatabaseSearchInstructions, RendererToMain
- Cleaned up unused variables: mode in main.ts, event parameter in close handler, detectLogosDatabase function
- Added ESLint ignore patterns for webpack and forge config files to prevent TypeScript parsing conflicts
- Verified successful Electron app startup with all type safety improvements and zero linting errors
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024) 

2025-07-18 fix: Resolved all ESLint warnings and errors - fixed React import in sonner.tsx, configured React version detection, and resolved React Hook dependency warnings in App.tsx 

2025-07-18 fix: Resolved ESLint configuration to exclude webpack build artifacts from linting process
- Added .webpack/ directory to ESLint ignore patterns to prevent linting of generated webpack bundle files
- Fixed thousands of false-positive ESLint errors from webpack-generated code containing webpack-specific variables
- ESLint now runs cleanly with zero errors on actual source code only
- Removed lint.errors file as all linting issues have been resolved
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024)

2025-07-19 refactor: Centralized configuration to eliminate default settings duplication
- Created central configuration module in packages/core/src/config/defaults.ts as single source of truth
- Eliminated duplicate default settings across 7 locations in CLI and Electron packages
- Updated XamlConverterOptions, MarkdownOptions, CLI help text, and all Electron default settings to use central config
- Improved maintainability by ensuring future setting changes only require updates in one location
- CLI help text now dynamically shows defaults from central configuration
- All TypeScript interfaces maintain type safety while removing code duplication
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024)

2025-07-19 fix: Resolved Electron webpack bundling errors caused by core package imports in renderer
- Fixed webpack errors where renderer process tried to bundle Node.js modules (fs, path, bun:sqlite) for browser
- Created local defaults file in packages/electron/src/renderer/config/defaults.ts to avoid core package imports
- Renderer process now uses local config while main process continues using central core config
- Electron app now starts successfully without webpack compilation errors
- Maintained centralized configuration benefits while respecting Electron's main/renderer process boundaries
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024)

2025-07-19 refactor: Implemented Separate Config Package architecture for true single source of truth
- Created new @logos-notes-exporter/config package with zero Node.js dependencies for browser compatibility
- Moved all default settings from core to centralized config package (packages/config/src/defaults.ts)
- Updated all packages (core, cli, electron) to import from central config package instead of local duplicates
- Configured webpack aliases in both main and renderer configs to resolve workspace packages properly
- Removed all duplicated config files: packages/core/src/config/ and packages/electron/src/renderer/config/
- Added config package to all workspace dependencies and TypeScript project references
- Successfully tested CLI and Electron functionality with centralized configuration
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024)

2025-07-19 fix: Fixed CLI not respecting default skipHighlights: true setting from centralized config
- CLI was not applying centralized default skipHighlights: true, causing highlights to be included instead of skipped
- Fixed CLI option parsing to use DEFAULT_CONFIG.export.skipHighlights when --skip-highlights flag not provided
- Added --include-highlights flag to allow users to override the default skip behavior when needed
- Updated CLI help text to clearly document both options and default behavior
- CLI now correctly skips highlights by default (328 notes vs 1987), matching Electron behavior
- Verified all flag combinations work: no flags (skip), --skip-highlights (skip), --include-highlights (include)
- Both CLI and Electron now consistently respect the centralized skipHighlights: true default
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024)