# Logos Notes Exporter

A TypeScript CLI tool that converts Logos Bible Software notes to Markdown files with YAML frontmatter, organized by notebooks.

## 🔍 Overview

This tool extracts notes from Logos Bible Software's NotesTool database and converts them into well-organized Markdown files. It preserves:

- **Note content** (rich text converted to Markdown)
- **Bible references** (decoded and formatted)
- **Notebook organization** (maintains Logos folder structure)
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
- **✨ Unicode Cleaning**: Automatically removes footnote markers and problematic Unicode characters that appear as question marks
- **🧹 Text Sanitization**: Cleans XAML content and removes zero-width characters, control characters, and footnote artifacts

## 🛠 Installation

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

## 📖 Usage

### Basic Export

```bash
# Export all notes with default settings
bun run export

# Specify custom database location
bun run export --database /path/to/notestool.db

# Export to custom directory
bun run export --output ./my-exported-notes
```

### Advanced Options

```bash
# Dry run to see what would be exported
bun run export --dry-run --verbose

# Export with date-based folders
bun run export --date-folders

# Export without YAML frontmatter
bun run export --no-frontmatter

# Include note IDs in metadata
bun run export --include-id

# Custom date format
bun run export --date-format short
```

### Command Line Options

```
OPTIONS:
  --database, -d        Path to NotesTool database file
  --output, -o          Output directory (default: ./exported-notes)
  
  ORGANIZATION:
  --organize-notebooks  Organize notes by notebooks (default: true)
  --date-folders        Create date-based subdirectories
  --index-files         Create README.md index files (default: true)
  
  MARKDOWN:
  --frontmatter         Include YAML frontmatter (default: true)
  --metadata            Include metadata in content (default: true)
  --dates               Include creation/modification dates (default: true)
  --references          Include Bible references (default: true)
  --notebook-info       Include notebook information (default: true)
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
exported-notes/
├── README.md                          # Main index with statistics
├── bible-study-notebook/               # Notebook folder
│   ├── README.md                      # Notebook index
│   ├── genesis-1-1-3.md              # Individual notes
│   ├── john-3-16.md
│   └── romans-8-28-30.md
├── sermon-notes/
│   ├── README.md
│   ├── easter-sermon-2024.md
│   └── christmas-message-2023.md
└── orphaned-notes/                    # Notes without notebooks
    ├── README.md
    └── miscellaneous-note.md
```

## 📄 Markdown Format

Each exported note includes comprehensive YAML frontmatter:

```yaml
---
title: "Genesis 1:1-3 - Creation"
created: "2024-01-15T10:30:00.000Z"
modified: "2024-01-20T14:45:00.000Z"
type: "note"
notebook:
  title: "Bible Study Notes"
  id: "bible-study-notebook-id"
  created: "2024-01-01T00:00:00.000Z"
references:
  - text: "Genesis 1:1-3"
    book: "Genesis"
    chapter: 1
    verse: 1
hasContent: true
tags:
  - "note"
  - "genesis"
  - "creation"
filename: "genesis-1-1-3"
path: "bible-study-notebook/genesis-1-1-3.md"
---

# In the Beginning

God created the heavens and the earth...

## References

- Genesis 1:1-3
```

## 🗄 Database Locations

- Database is always opened read-only

For Development:

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
- **`unicode-cleaner.ts`**: Advanced Unicode text cleaning and footnote marker removal
- **`validator.ts`**: Export quality assurance and validation
- **`cli.ts`**: Command-line interface

## 🧪 Development

### Project Structure

```
src/
├── cli.ts                 # Main CLI entry point
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

- **Read-only**: Only reads from Logos databases, does not modify them
- **SQLite dependency**: Requires access to the NotesTool SQLite database
- **Rich text**: Complex formatting may not convert perfectly to Markdown
- **Version compatibility**: Tested with recent Logos versions

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
- The TypeScript and Bun communities for excellent tooling
- Contributors who help improve this tool

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/logos-notes-exporter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/logos-notes-exporter/discussions)
- **Documentation**: See the `/docs` folder for detailed documentation

---

**Made with ❤️ for the Bible study community**
