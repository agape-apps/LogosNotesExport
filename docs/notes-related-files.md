# Notes-Related Files in LogosDocuments Directory

## Overview
This document catalogs all files and databases related to notes, annotations, highlights, and user-generated content found in the LogosDocuments directory structure.

## Directory Structure Analysis

The LogosDocuments directory contains 22 main subdirectories, with several containing notes-related content:

### Primary Notes Directories

#### 1. Documents/Notes/
**Location:** `LogosDocuments/Documents/Notes/`
**Purpose:** Main notes storage location
**Files:**
- `notes.db` (1.7 MB) - Primary notes database
- `notes-test.db` (1.7 MB) - Test/backup notes database
- `notes.db-wal`, `notes.db-shm` - SQLite Write-Ahead Log and Shared Memory files
- `notes-test.db-wal`, `notes-test.db-shm` - Test database WAL/SHM files
- `notes.db.flock` - File lock for database access control

**Database Type:** SQLite 3.x database, UTF-8 encoded

#### 2. NotesToolManager/
**Location:** `LogosDocuments/NotesToolManager/`
**Purpose:** Notes tool management and configuration
**Files:**
- `notestool.db` (2.9 MB) - Main notes tool database
- `notestool-test.db` (2.9 MB) - Test notes tool database
- `notestool.db-wal` (3.1 MB) - Large WAL file indicating active usage
- `notestool.db-shm` - Shared memory file
- `notestool.db.flock` - File lock

**Database Type:** SQLite 3.x database, UTF-8 encoded

### Secondary Notes-Related Directories

#### 3. VisualMarkup/
**Location:** `LogosDocuments/VisualMarkup/`
**Purpose:** Visual annotations, highlights, and markup
**Files:**
- `visualmarkup.db` - SQLite database for visual annotations
- `visualmarkup.db-wal`, `visualmarkup.db-shm`, `visualmarkup.db.flock`

#### 4. Documents/Clippings/
**Location:** `LogosDocuments/Documents/Clippings/`
**Purpose:** Text clippings and excerpts (note-like content)
**Files:**
- `Clippings.db` - SQLite database for clippings
- `Clippings.db-wal`, `Clippings.db-shm`, `Clippings.db.flock`

#### 5. PersonalBooks/
**Location:** `LogosDocuments/PersonalBooks/`
**Purpose:** User-created books and documents (may contain notes)
**Files:**
- `PersonalBookManager.db` - SQLite database for personal books
- `PersonalBookManager.db-wal`, `PersonalBookManager.db-shm`, `PersonalBookManager.db.flock`

## Complete Database Inventory

**Total SQLite Databases Found:** 38

### Notes-Specific Databases:
1. `Documents/Notes/notes.db` - Primary notes storage
2. `Documents/Notes/notes-test.db` - Test notes storage
3. `NotesToolManager/notestool.db` - Notes tool management
4. `NotesToolManager/notestool-test.db` - Test notes tool management

### Related Content Databases:
5. `VisualMarkup/visualmarkup.db` - Highlights and visual annotations
6. `Documents/Clippings/Clippings.db` - Text clippings and excerpts
7. `PersonalBooks/PersonalBookManager.db` - Personal books (may contain notes)

### Other Document Types in Documents Directory:
- BibleStudy
- Bibliography
- Canvas
- MorphGrid
- PassageList
- PrayerList
- ReadingPlan
- SentenceDiagram
- Sermon
- SyntaxSearch
- VisualFilter
- WordFind
- WordList

## Document Indexing System

The Documents directory contains a sophisticated indexing system:
- `DocumentInfo.db` - Main document information database
- `documents.dcm` - Document cache metadata
- `documents.fld` - Field definitions
- `documents.idx` - Search index
- `documents.lck` - Lock file
- `documents.lxn` - Lexicon data
- `documents.met` - Metadata

## File Size Analysis

**Largest Notes Databases:**
1. `notestool.db-wal` - 3.1 MB (active write-ahead log)
2. `notestool.db` - 2.9 MB
3. `notestool-test.db` - 2.9 MB
4. `notes.db` - 1.7 MB
5. `notes-test.db` - 1.7 MB

## Key Findings

1. **Dual Database System:** Both primary and test versions exist for core note databases
2. **Active Usage:** Large WAL files indicate recent active usage
3. **Comprehensive Storage:** Notes are stored across multiple specialized databases
4. **SQLite Standard:** All databases use SQLite 3.x format with UTF-8 encoding
5. **File Locking:** Proper file locking mechanisms in place for concurrent access
6. **Visual Annotations:** Separate database for visual markup and highlights
7. **Related Content:** Clippings and personal books provide additional note-like content

## Database Schema Exploration Recommendations

For deeper analysis, these databases should be examined for their table structures:
- Primary focus: `notes.db` and `notestool.db`
- Secondary: `visualmarkup.db` and `Clippings.db`
- Supporting: `DocumentInfo.db` for document relationships

## Security Considerations

- All databases use file locking mechanisms
- WAL files indicate transaction logging is enabled
- Shared memory files suggest multi-process access capabilities
- Test databases provide backup/staging environments

## Complete Database File Listing

For reference, here is the complete sorted list of all 38 SQLite database files found:

```
LogosDocuments/CopyBibleVerses/CopyBibleVerses.db
LogosDocuments/DeviceResourceManager/MobileResourcesSyncManager.db
LogosDocuments/Documents/BibleStudy/BibleStudy.db
LogosDocuments/Documents/Bibliography/Bibliography.db
LogosDocuments/Documents/Canvas/Canvas.db
LogosDocuments/Documents/Clippings/Clippings.db
LogosDocuments/Documents/DocumentInfo.db
LogosDocuments/Documents/MorphGrid/MorphGrid.db
LogosDocuments/Documents/Notes/notes-test.db
LogosDocuments/Documents/Notes/notes.db
LogosDocuments/Documents/PassageList/PassageList.db
LogosDocuments/Documents/PrayerList/PrayerList.db
LogosDocuments/Documents/ReadingPlan/ReadingPlan.db
LogosDocuments/Documents/SentenceDiagram/SentenceDiagram.db
LogosDocuments/Documents/Sermon/Sermon.db
LogosDocuments/Documents/SyntaxSearch/SyntaxSearch.db
LogosDocuments/Documents/VisualFilter/VisualFilter.db
LogosDocuments/Documents/WordFind/WordFind.db
LogosDocuments/Documents/WordList/wordlist.db
LogosDocuments/FavoritesManager/favorites.db
LogosDocuments/Guides/guides.db
LogosDocuments/KeyLinkManager/KeyLinkSyncManager.db
LogosDocuments/LayoutManager/layouts.db
LogosDocuments/LibraryCatalog/LibraryCatalogSync.db
LogosDocuments/LocalUserPreferences/PreferencesManager.db
LogosDocuments/NotesToolManager/notestool-test.db
LogosDocuments/NotesToolManager/notestool.db
LogosDocuments/PersonalBooks/PersonalBookManager.db
LogosDocuments/ReadingLists/ReadingLists.db
LogosDocuments/ReferenceWordCounts/ReferenceWordCountManager.db
LogosDocuments/ResourceCollectionManager/ResourceCollectionManager.db
LogosDocuments/ResourceManager/ResourceSyncManager.db
LogosDocuments/SelfTests/SelfTests.db
LogosDocuments/ShortcutsManager/shortcuts.db
LogosDocuments/UserInputs/UserInputs2.db
LogosDocuments/UserPreferences2/PreferencesManager.db
LogosDocuments/VisualMarkup/visualmarkup.db
LogosDocuments/Workflows/Workflows.db
```

## Next Steps for Notes Extraction

Based on this analysis, the primary databases to explore for notes content are:

1. **`Documents/Notes/notes.db`** - Main notes storage (highest priority)
2. **`NotesToolManager/notestool.db`** - Notes tool management and metadata
3. **`VisualMarkup/visualmarkup.db`** - Visual annotations and highlights
4. **`Documents/Clippings/Clippings.db`** - Text clippings and excerpts
5. **`PersonalBooks/PersonalBookManager.db`** - User-created content

These databases can be examined using SQLite tools to understand their schema and extract notes content in various formats. 