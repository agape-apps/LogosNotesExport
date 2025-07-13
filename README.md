# Logos Notes Exporter

A command line tool that converts Logos Bible Notes to Markdown files with YAML front-matter, organized by notebooks.

## 🔍 Overview

**Note: this is Beta Software which has only received limited testing.**

This tool extracts notes from Logos Bible Software's NotesTool database and converts them into well-organized Markdown files. It preserves:

- **Note content** (rich text converted to Markdown)
- **Bible references** (decoded and formatted)
- **Notebook organization** (maintains Logos Notebook folder structure)
- **Metadata** (creation dates, note types, etc.)
- **YAML frontmatter** (for compatibility with note-taking apps)

## ✨ Features

- **📚 Notebook Organization**: Notes are organized by their original Logos notebooks
- **🔗 Bible References**: Automatically decodes and formats Bible references
- **📝 Rich Metadata**: Includes YAML frontmatter with comprehensive note information
- **🎨 Multiple Note Types**: Supports text notes, highlights, and annotations
- **📁 Flexible Output**: Customizable directory structure and file organization
- **🔍 Dry Run Mode**: Preview what will be exported before writing files
- **📊 Statistics**: Detailed export statistics and progress reporting
- **🧹 Text Sanitization**: Cleans Rich Text (XAML) content and removes problematic Unicode characters
- **🔒 Read-only**: Safely opens Logos user databases in read-only mode, does not modify them

## Intended Use Cases

- use Notebook folders in Obsidian, Typora or in other front-matter compatible Markdown applications
- use as a vendor independent backup of your personal notes and highlights

## 🛠 Installation

### 📦 Download Binaries

from https://github.com/agape-apps/LogosNotesExport/releases

Choose the binary for your platform:

- **🍎 macOS (Intel)**: `LogosNotesExporter-macos-x64` (tested and working)
- **🍎 macOS (Apple Silicon)**: `LogosNotesExporter-macos-arm64` (untested)
- **🪟 Windows**: `LogosNotesExporter-windows-x64.exe` (works, limited testing)

## 📖 Getting Started (in a Terminal)

on macOS:
- make executable, move & rename, run

```
chmod +x LogosNotesExporter-*
mv -v LogosNotesExporter-* /usr/local/bin/LogosNotesExporter
LogosNotesExporter --help
```

on Windows run:
```
LogosNotesExporter-windows-x64.exe --help
```

### Basic Export

```bash
# Export all notes with default settings into Notebook folders
LogosNotesExporter

# Specify custom database location
LogosNotesExporter --database /path/to/notestool.db

# Export to custom directory
LogosNotesExporter --output ./my-exported-notes
```

### Advanced Options

```bash
# Dry run to see what would be exported
LogosNotesExporter --dry-run --verbose

# Export with date-based folders (instead of Notebook folders)
LogosNotesExporter --date-folders --no-organize-notebooks

# Export without YAML frontmatter and show some metadata in content
LogosNotesExporter --no-frontmatter --show-metadata

# Include note IDs in metadata
LogosNotesExporter --include-id

# Custom date format
LogosNotesExporter --date-format short
```

### Command Line Options

```
OPTIONS:
  --database, -d        Path to NotesTool database file
  --output, -o          Output directory (default: ./exported-notes)
  
  ORGANIZATION:
  --no-organize-notebooks  Disable organizing notes by notebooks (default: organize by notebooks)
  --date-folders           Create date-based subdirectories
  --skip-highlights        Skip highlight notes, export only text and annotation notes
  --no-index-files         Do not create README.md index files (default: create them)
  
  MARKDOWN:
  --no-frontmatter      Exclude YAML frontmatter (default: include)
  --show-metadata       Include metadata in markdown content (default: only shown in frontmatter)
  --no-dates            Exclude creation/modification dates (default: include)
  --no-notebook-info    Exclude notebook information (default: include)
  --include-id          Include note IDs
  --date-format         Date format: iso, locale, short (default: iso)
  
  PROCESSING:
  --verbose, -v         Verbose output
  --dry-run            Show what would be done without writing files
  --help, -h           Show help
  --version            Show version
```

## 📁 Output Structure

The tool creates a well-organized directory structure:

```
Logos-Exported-Notes/
├── README.md                       # Main index with statistics
├── Topical Notebook Folder/        
│   ├── README.md                   # Notebook index
│   ├── NT66_Rom-08.02.md           # Individual notes
│   ├── NT70_Eph-06.17.md
│   └── NT72_Col-02.11.md
├── Another Notebook Folder/
│   ├── README.md
│   ├── NT61_Matt-04.04.md
│   └── NT64_John-06.63.md
└── No Notebook/                    # Notes without notebooks
    ├── README.md
    └── NT81_1Pet-03.15.md
```

## 📄 Markdown Format

Each exported note includes comprehensive YAML front-matter:

```yaml
---
title: "Matthew 24:6-8"
created: "2013-01-22T23:49:35.000Z"
modified: "2013-01-22T23:52:42.000Z"
tags:
  - "disasters"
  - "matthew"
  - "text"
noteType: "text"
references:
  - "Matthew 24:6-8"
noteId: 583
notebook: "Disasters"
logosBibleBook: 61
bibleVersion: "NKJV"
noteStyle: "highlight"
noteColor: "yellow"
noteIndicator: "exclamation"
dataType: "bible"
resourceId: "LLS:1.0.30"
resourceTitle: "The New King James Version"
anchorLink: "https://app.logos.com/books/LLS%3A1.0.30/references/bible+nkjv.61.24.6-61.24.8"
filename: "NT61_Matt-24.06"
---

And you will hear of wars and rumors of wars. See that you are not troubled; for all these things must come to pass, but the end is not yet.  For nation will rise against nation, and kingdom against ...

- Do not be troubled
- These things must come to pass
```

## Development

### Prerequisites

- [Bun - install from here](https://bun.sh/) runtime (v1.0.0 or higher)
- Access to Logos Bible Software NotesTool database file

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/logos-notes-exporter.git
cd logos-notes-exporter

# Check Bun installation and Install dependencies
bun --version
bun install

# Make CLI executable
chmod +x src/cli.ts
```

## Build Binaries for macOS and Windows

```sh
bun run binary:macx64    # Build for macOS Intel
bun run binary:macarm    # Build for macOS Apple Silicon  
bun run binary:windows   # Build for Windows x64
```

- LogosNotesExporter binary files will be in bin/...

## Publish release

- Update version in package.json and publish new binary release
- this will trigger new Release builds via Github actions

```sh
scripts/create-release.sh
```

## 📖 Usage

during development run

```sh
bun run export [options]
```

## 🗄 Database Locations

- Database is always opened read-only
- Bible references are always included when available

For Development (use copy of database):

```
LogosDocuments/NotesToolManager/notestool.db
```

The tool looks for the NotesTool database in these common locations:

### Windows
```
%LOCALAPPDATA%\Logos4\Documents\<RANDOM_ID>\NotesToolManager\notestool.db
```

### macOS
```
~/Library/Application Support/Logos4/Documents/<RANDOM_ID>/NotesToolManager/notestool.db
```

### Custom Location
Specify with the `--database` option.

## 🏗 Architecture

The project follows a modular architecture:

- **`notestool-database.ts`**: SQLite database interface
- **`reference-decoder.ts`**: Bible reference parsing and formatting
- **`notebook-organizer.ts`**: Note organization by notebooks
- **`file-organizer.ts`**: File structure and path management
- **`markdown-converter.ts`**: Markdown generation with YAML frontmatter
- **`xaml-converter.ts`**: XAML-to-Markdown conversion with formatting preservation
- **`unicode-cleaner.ts`**: Unicode text cleaning and footnote marker removal
- **`validator.ts`**: Export quality assurance and validation
- **`cli.ts`**: Command-line interface

### Project Structure

```
src/
├── cli.ts                # Main CLI entry point
├── types.ts              # Shared type definitions
├── notestool-database.ts # Database interface
├── reference-decoder.ts  # Bible reference decoder
├── notebook-organizer.ts # Note organization logic
├── file-organizer.ts     # File structure management
└── markdown-converter.ts # Markdown generation
```

### Running Tests

```bash
bun test
```

### Type Checking

```bash
bun run lint
```

### Building

```bash
bun run build
```

## 📊 Supported Note Types

- **Text Notes** (kind: 0): Regular text notes
- **Highlights** (kind: 1): Highlighted text passages
- **Annotations** (kind: 2): Annotated text with comments

## 🔗 Bible Reference Support

The tool supports Logos Bible reference formats:

- **Anchor format**: `bible+nkjv.61.24.14` → "1 Peter 24:14"
- **Dotted format**: `61.24.14` → "1 Peter 24:14"
- **Range support**: Multi-verse and multi-chapter ranges

## 🚨 Limitations

- **SQLite dependency**: Requires access to the NotesTool SQLite database
- **Rich text**: Complex formatting may not convert fully to Markdown
- **Version compatibility**: Tested with recent Logos 10 desktop versions
- **Highlights**: the verse range is shown for Bibles, highlights in books lack a reference

## OS & Software Versions
- Logos 10 (Logos Bible Study 43.0.377)
- macOS Sequoia 15.5
- Windows 10 version 22H2

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Logos Bible Software for creating an excellent study platform
- The Bun community for the excellent JavaScript runtime
- Contributors who help improve this tool

## 📞 Support

- **Issues & Feature Requests**: [GitHub Issues](https://github.com/agape-apps/LogosNotesExport/issues)
- **Documentation**: See the `/docs` folder for detailed documentation

## Notice: Independent Software
This application is developed independently and has no affiliation with Faithlife Corporation or their Logos Bible Software product. This software is not officially supported or endorsed by Faithlife.

---

**Made with ❤️ for the Bible study community**
