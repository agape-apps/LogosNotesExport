# Changelog

## 2025-07-15
- feat: Complete Phase 1 core integration and implement Phase 2 Basic Mode UI with real export functionality

- Replaced simulated export with real core library integration using NotebookOrganizer, FileOrganizer, MarkdownConverter, and CatalogDatabase classes
- Implemented auto database detection using DatabaseLocator.findDatabases() and DatabaseLocator.getBestDatabase() methods  
- Created complete Basic Mode UI with left/right column layout featuring export controls and real-time output log display
- Added missing ShadcnUI components (checkbox, select, switch, tooltip, alert, dialog) for future Advanced mode implementation
- Integrated Zustand store with IPC communication for proper state management between main and renderer processes
- Implemented functional Export Notes button with real-time progress tracking and XAML conversion statistics
- Added Open Notes Folder button that enables after successful export completion
- Created comprehensive error handling and user feedback using toast notifications and detailed logging
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024)

## 2025-07-15 (Refactoring)
- refactor: Move main export logic from CLI to unified core LogosNotesExporter class for code reuse

- Created new LogosNotesExporter class in packages/core/src/exporter.ts with configurable logging and progress callbacks
- Refactored CLI to use the unified core exporter instead of duplicated logic
- Updated Electron export-handler.ts to use the same core exporter with IPC callbacks
- Added database adapter (database-adapter.ts) to handle bun:sqlite compatibility in Electron webpack environment
- Configured webpack alias to map bun:sqlite to better-sqlite3 adapter for Electron builds
- Both CLI and Electron now use identical export logic from core, ensuring consistency and reducing maintenance overhead
- Exact LLM Model string: Claude Sonnet 4 (Anthropic, 2024) 

## 2025-07-15 - Fix React hooks and type compatibility errors, resolve bun:sqlite webpack issues for successful Electron app launch

- Fixed bun:sqlite webpack resolution using NormalModuleReplacementPlugin instead of aliases
- Created database-adapter.ts wrapper for better-sqlite3 to provide bun:sqlite compatibility
- Downgraded React from v19 to v18 (^18.3.1) to fix useSyncExternalStore hooks compatibility with Zustand
- Downgraded @types/react and @types/react-dom to v18 compatible versions (^18.3.12, ^18.3.1)
- Downgraded Radix UI packages to React 18 compatible versions to fix TypeScript type conflicts
- Resolved port 9000 conflicts that were preventing app startup
- Verified successful Electron app launch with all core export functionality working
- Exact LLM Model string: Claude 3.5 Sonnet (Anthropic, 2024) 