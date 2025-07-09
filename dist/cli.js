#!/usr/bin/env bun
// @bun
var __require = import.meta.require;

// src/cli.ts
import { parseArgs } from "util";
import { existsSync as existsSync4 } from "fs";
import { join as join4 } from "path";

// src/reference-decoder.ts
class BibleReferenceDecoder {
  bookMappings = new Map;
  constructor() {
    this.initializeBookMappings();
  }
  decodeReference(reference, anchorBookId) {
    try {
      if (reference.includes("bible+")) {
        return this.decodeBiblePlusReference(reference, anchorBookId);
      } else if (reference.includes(".")) {
        return this.decodeDottedReference(reference, anchorBookId);
      } else {
        return this.decodeSimpleReference(reference, anchorBookId);
      }
    } catch (error) {
      console.warn(`Failed to decode reference: ${reference}`, error);
      return null;
    }
  }
  getBookName(anchorBookId) {
    const mapping = this.bookMappings.get(anchorBookId);
    return mapping ? mapping.englishName : `Unknown Book ${anchorBookId}`;
  }
  decodeBiblePlusReference(reference, anchorBookId) {
    const match = reference.match(/bible\+([^.]+)\.(\d+)\.(\d+)\.(\d+)(?:-(\d+)\.(\d+)\.(\d+))?/);
    if (!match)
      return null;
    const [, version, bookNum, chapter, verse, endBook, endChapter, endVerse] = match;
    const bookId = parseInt(bookNum || "0");
    const bookName = this.getBookName(anchorBookId || bookId);
    const bookMapping = this.bookMappings.get(anchorBookId || bookId);
    const isSingleChapterBook = bookMapping?.chapterCount === 1;
    let actualChapter;
    let actualVerse;
    if (isSingleChapterBook) {
      actualChapter = parseInt(verse || "0");
      actualVerse = undefined;
    } else {
      actualChapter = parseInt(chapter || "0");
      actualVerse = parseInt(verse || "0");
    }
    const result = {
      bookName,
      chapter: actualChapter,
      verse: actualVerse,
      reference,
      anchorBookId: anchorBookId || bookId,
      formatted: this.formatReference(bookName, actualChapter, actualVerse, endChapter ? parseInt(endChapter || "0") : undefined, endVerse ? parseInt(endVerse || "0") : undefined)
    };
    if (endChapter && endVerse) {
      result.endChapter = parseInt(endChapter || "0");
      result.endVerse = parseInt(endVerse || "0");
    }
    return result;
  }
  decodeDottedReference(reference, anchorBookId) {
    const parts = reference.split(".");
    if (parts.length < 2)
      return null;
    const bookId = anchorBookId || parseInt(parts[0] || "0");
    const chapter = parseInt(parts[1] || "0");
    const verse = parts[2] ? parseInt(parts[2] || "0") : undefined;
    const bookName = this.getBookName(bookId);
    return {
      bookName,
      chapter,
      verse,
      reference,
      anchorBookId: bookId,
      formatted: this.formatReference(bookName, chapter, verse)
    };
  }
  decodeSimpleReference(reference, anchorBookId) {
    if (!anchorBookId)
      return null;
    const bookName = this.getBookName(anchorBookId);
    return {
      bookName,
      reference,
      anchorBookId,
      formatted: `${bookName} (${reference})`
    };
  }
  formatReference(bookName, chapter, verse, endChapter, endVerse) {
    let formatted = bookName;
    const bookMapping = Array.from(this.bookMappings.values()).find((b) => b.englishName === bookName);
    const isSingleChapterBook = bookMapping?.chapterCount === 1;
    if (chapter) {
      if (isSingleChapterBook) {
        formatted += ` ${chapter}`;
        if (verse) {
          formatted += `-${verse}`;
        }
      } else {
        formatted += ` ${chapter}`;
        if (verse) {
          formatted += `:${verse}`;
          if (endChapter && endVerse) {
            if (endChapter === chapter) {
              formatted += `-${endVerse}`;
            } else {
              formatted += `-${endChapter}:${endVerse}`;
            }
          }
        }
      }
    }
    return formatted;
  }
  initializeBookMappings() {
    const otBooks = [
      { anchorId: 1, englishName: "Genesis", osisId: 1, chapterCount: 50, status: "Complete" },
      { anchorId: 2, englishName: "Exodus", osisId: 2, chapterCount: 40, status: "Complete" },
      { anchorId: 3, englishName: "Leviticus", osisId: 3, chapterCount: 27, status: "Partial" },
      { anchorId: 4, englishName: "Numbers", osisId: 4, chapterCount: 36, status: "Partial" },
      { anchorId: 5, englishName: "Deuteronomy", osisId: 5, chapterCount: 34, status: "Complete" },
      { anchorId: 6, englishName: "Joshua", osisId: 6, chapterCount: 24, status: "Complete" },
      { anchorId: 7, englishName: "Judges", osisId: 7, chapterCount: 21, status: "Complete" },
      { anchorId: 8, englishName: "Ruth", osisId: 8, chapterCount: 4, status: "Complete" },
      { anchorId: 9, englishName: "1 Samuel", osisId: 9, chapterCount: 31, status: "Complete" },
      { anchorId: 10, englishName: "2 Samuel", osisId: 10, chapterCount: 24, status: "Complete" },
      { anchorId: 11, englishName: "1 Kings", osisId: 11, chapterCount: 22, status: "Complete" },
      { anchorId: 12, englishName: "2 Kings", osisId: 12, chapterCount: 25, status: "Complete" },
      { anchorId: 13, englishName: "1 Chronicles", osisId: 13, chapterCount: 29, status: "Partial" },
      { anchorId: 14, englishName: "2 Chronicles", osisId: 14, chapterCount: 36, status: "Partial" },
      { anchorId: 15, englishName: "Ezra", osisId: 15, chapterCount: 10, status: "Complete" },
      { anchorId: 16, englishName: "Nehemiah", osisId: 16, chapterCount: 13, status: "Complete" },
      { anchorId: 17, englishName: "Esther", osisId: 17, chapterCount: 10, status: "Complete" },
      { anchorId: 18, englishName: "Job", osisId: 18, chapterCount: 42, status: "Complete" },
      { anchorId: 19, englishName: "Psalms", osisId: 19, chapterCount: 150, status: "Complete" },
      { anchorId: 20, englishName: "Proverbs", osisId: 20, chapterCount: 31, status: "Complete" },
      { anchorId: 21, englishName: "Ecclesiastes", osisId: 21, chapterCount: 12, status: "Complete" },
      { anchorId: 22, englishName: "Song of Solomon", osisId: 22, chapterCount: 8, status: "Complete" },
      { anchorId: 23, englishName: "Isaiah", osisId: 23, chapterCount: 66, status: "Complete" },
      { anchorId: 24, englishName: "Jeremiah", osisId: 24, chapterCount: 52, status: "Partial" },
      { anchorId: 25, englishName: "Lamentations", osisId: 25, chapterCount: 5, status: "Complete" },
      { anchorId: 26, englishName: "Ezekiel", osisId: 26, chapterCount: 48, status: "Partial" },
      { anchorId: 27, englishName: "Daniel", osisId: 27, chapterCount: 12, status: "Complete" },
      { anchorId: 28, englishName: "Hosea", osisId: 28, chapterCount: 14, status: "Complete" },
      { anchorId: 29, englishName: "Joel", osisId: 29, chapterCount: 3, status: "Complete" },
      { anchorId: 30, englishName: "Amos", osisId: 30, chapterCount: 9, status: "Complete" },
      { anchorId: 31, englishName: "Obadiah", osisId: 31, chapterCount: 1, status: "Complete" },
      { anchorId: 32, englishName: "Jonah", osisId: 32, chapterCount: 4, status: "Complete" },
      { anchorId: 33, englishName: "Micah", osisId: 33, chapterCount: 7, status: "Complete" },
      { anchorId: 34, englishName: "Nahum", osisId: 34, chapterCount: 3, status: "Complete" },
      { anchorId: 35, englishName: "Habakkuk", osisId: 35, chapterCount: 3, status: "Complete" },
      { anchorId: 36, englishName: "Zephaniah", osisId: 36, chapterCount: 3, status: "Complete" },
      { anchorId: 37, englishName: "Haggai", osisId: 37, chapterCount: 2, status: "Complete" },
      { anchorId: 38, englishName: "Zechariah", osisId: 38, chapterCount: 14, status: "Complete" },
      { anchorId: 39, englishName: "Malachi", osisId: 39, chapterCount: 4, status: "Complete" }
    ];
    const apocryphaBooks = [
      { anchorId: 40, englishName: "Tobit", osisId: 67, chapterCount: 14, status: "Complete" },
      { anchorId: 41, englishName: "Judith", osisId: 68, chapterCount: 16, status: "Complete" },
      { anchorId: 42, englishName: "Esther (Greek)", osisId: 69, chapterCount: 16, status: "Complete" },
      { anchorId: 43, englishName: "The Wisdom of Solomon", osisId: 70, chapterCount: 19, status: "Complete" },
      { anchorId: 44, englishName: "Ecclesiasticus (Sirach)", osisId: 71, chapterCount: 51, status: "Complete" },
      { anchorId: 45, englishName: "Baruch", osisId: 72, chapterCount: 6, status: "Complete" },
      { anchorId: 46, englishName: "The Letter of Jeremiah", osisId: 73, chapterCount: 1, status: "Complete" },
      { anchorId: 47, englishName: "The Prayer of Azariah and the Song of the Three Jews", osisId: 74, chapterCount: 1, status: "Complete" },
      { anchorId: 48, englishName: "Susanna", osisId: 75, chapterCount: 1, status: "Complete" },
      { anchorId: 49, englishName: "Bel and the Dragon", osisId: 76, chapterCount: 1, status: "Complete" },
      { anchorId: 50, englishName: "1 Maccabees", osisId: 77, chapterCount: 16, status: "Complete" },
      { anchorId: 51, englishName: "2 Maccabees", osisId: 78, chapterCount: 15, status: "Complete" },
      { anchorId: 52, englishName: "1 Esdras", osisId: 79, chapterCount: 9, status: "Complete" },
      { anchorId: 53, englishName: "Prayer of Manasseh", osisId: 80, chapterCount: 1, status: "Complete" },
      { anchorId: 54, englishName: "Psalm 151", osisId: 81, chapterCount: 1, status: "Complete" },
      { anchorId: 55, englishName: "3 Maccabees", osisId: 82, chapterCount: 7, status: "Complete" },
      { anchorId: 56, englishName: "2 Esdras", osisId: 83, chapterCount: 16, status: "Complete" },
      { anchorId: 57, englishName: "4 Maccabees", osisId: 84, chapterCount: 18, status: "Complete" }
    ];
    const ntBooks = [
      { anchorId: 61, englishName: "Matthew", osisId: 40, chapterCount: 28, status: "Complete" },
      { anchorId: 62, englishName: "Mark", osisId: 41, chapterCount: 16, status: "Complete" },
      { anchorId: 63, englishName: "Luke", osisId: 42, chapterCount: 24, status: "Complete" },
      { anchorId: 64, englishName: "John", osisId: 43, chapterCount: 21, status: "Complete" },
      { anchorId: 65, englishName: "Acts", osisId: 44, chapterCount: 28, status: "Complete" },
      { anchorId: 66, englishName: "Romans", osisId: 45, chapterCount: 16, status: "Complete" },
      { anchorId: 67, englishName: "1 Corinthians", osisId: 46, chapterCount: 16, status: "Complete" },
      { anchorId: 68, englishName: "2 Corinthians", osisId: 47, chapterCount: 13, status: "Complete" },
      { anchorId: 69, englishName: "Galatians", osisId: 48, chapterCount: 6, status: "Complete" },
      { anchorId: 70, englishName: "Ephesians", osisId: 49, chapterCount: 6, status: "Complete" },
      { anchorId: 71, englishName: "Philippians", osisId: 50, chapterCount: 4, status: "Complete" },
      { anchorId: 72, englishName: "Colossians", osisId: 51, chapterCount: 4, status: "Complete" },
      { anchorId: 73, englishName: "1 Thessalonians", osisId: 52, chapterCount: 5, status: "Complete" },
      { anchorId: 74, englishName: "2 Thessalonians", osisId: 53, chapterCount: 3, status: "Complete" },
      { anchorId: 75, englishName: "1 Timothy", osisId: 54, chapterCount: 6, status: "Complete" },
      { anchorId: 76, englishName: "2 Timothy", osisId: 55, chapterCount: 4, status: "Complete" },
      { anchorId: 77, englishName: "Titus", osisId: 56, chapterCount: 3, status: "Complete" },
      { anchorId: 78, englishName: "Philemon", osisId: 57, chapterCount: 1, status: "Complete" },
      { anchorId: 79, englishName: "Hebrews", osisId: 58, chapterCount: 13, status: "Complete" },
      { anchorId: 80, englishName: "James", osisId: 59, chapterCount: 5, status: "Complete" },
      { anchorId: 81, englishName: "1 Peter", osisId: 60, chapterCount: 5, status: "Complete" },
      { anchorId: 82, englishName: "2 Peter", osisId: 61, chapterCount: 3, status: "Complete" },
      { anchorId: 83, englishName: "1 John", osisId: 62, chapterCount: 5, status: "Complete" },
      { anchorId: 84, englishName: "2 John", osisId: 63, chapterCount: 1, status: "Complete" },
      { anchorId: 85, englishName: "3 John", osisId: 64, chapterCount: 1, status: "Complete" },
      { anchorId: 86, englishName: "Jude", osisId: 65, chapterCount: 1, status: "Complete" },
      { anchorId: 87, englishName: "Revelation", osisId: 66, chapterCount: 22, status: "Complete" }
    ];
    [...otBooks, ...apocryphaBooks, ...ntBooks].forEach((book) => {
      this.bookMappings.set(book.anchorId, book);
    });
  }
  getBookMappings() {
    return Array.from(this.bookMappings.values());
  }
  isValidBookId(bookId) {
    return this.bookMappings.has(bookId);
  }
}

// src/notebook-organizer.ts
class NotebookOrganizer {
  database;
  referenceDecoder;
  constructor(database) {
    this.database = database;
    this.referenceDecoder = new BibleReferenceDecoder;
  }
  async organizeNotes() {
    const notes = this.database.getActiveNotes();
    const notebooks = this.database.getActiveNotebooks();
    const allReferences = this.database.getBibleReferences();
    const notebookMap = new Map;
    notebooks.forEach((nb) => notebookMap.set(nb.externalId, nb));
    const referencesMap = new Map;
    allReferences.forEach((ref) => {
      const decoded = this.referenceDecoder.decodeReference(ref.reference, ref.bibleBook);
      if (decoded) {
        if (!referencesMap.has(ref.noteId)) {
          referencesMap.set(ref.noteId, []);
        }
        const noteReferences = referencesMap.get(ref.noteId);
        if (noteReferences) {
          noteReferences.push(decoded);
        }
      }
    });
    const notebookGroups = new Map;
    const orphanedGroup = {
      notebook: null,
      notes: [],
      totalNotes: 0,
      sanitizedFolderName: "orphaned-notes"
    };
    for (const note of notes) {
      const organizedNote = this.processNote(note, notebookMap, referencesMap);
      if (organizedNote.notebook) {
        const notebookId = organizedNote.notebook.externalId;
        if (!notebookGroups.has(notebookId)) {
          notebookGroups.set(notebookId, {
            notebook: organizedNote.notebook,
            notes: [],
            totalNotes: 0,
            sanitizedFolderName: this.sanitizeFilename(organizedNote.notebook.title || "untitled-notebook")
          });
        }
        const group = notebookGroups.get(notebookId);
        group.notes.push(organizedNote);
        group.totalNotes++;
      } else {
        orphanedGroup.notes.push(organizedNote);
        orphanedGroup.totalNotes++;
      }
    }
    const result = Array.from(notebookGroups.values()).sort((a, b) => (a.notebook?.title || "").localeCompare(b.notebook?.title || ""));
    if (orphanedGroup.totalNotes > 0) {
      result.push(orphanedGroup);
    }
    return result;
  }
  getOrganizationStats() {
    const notes = this.database.getActiveNotes();
    const notebooks = this.database.getActiveNotebooks();
    const references = this.database.getBibleReferences();
    const notesWithContent = notes.filter((n) => n.contentRichText && n.contentRichText.trim() !== "").length;
    const noteIdsWithReferences = new Set(references.map((r) => r.noteId));
    const notesWithReferences = notes.filter((n) => noteIdsWithReferences.has(n.id)).length;
    const notebookIds = new Set(notebooks.map((nb) => nb.externalId));
    const orphanedNotes = notes.filter((n) => !notebookIds.has(n.notebookExternalId)).length;
    return {
      totalNotes: notes.length,
      notesWithContent,
      notesWithReferences,
      notebooks: notebooks.length,
      orphanedNotes
    };
  }
  getNotesByNotebook(notebookExternalId) {
    const allNotes = this.database.getActiveNotes();
    const notes = allNotes.filter((n) => n.notebookExternalId === notebookExternalId);
    const notebooks = this.database.getActiveNotebooks();
    const allReferences = this.database.getBibleReferences();
    const notebookMap = new Map;
    notebooks.forEach((nb) => notebookMap.set(nb.externalId, nb));
    const referencesMap = new Map;
    allReferences.forEach((ref) => {
      const decoded = this.referenceDecoder.decodeReference(ref.reference, ref.bibleBook);
      if (decoded) {
        if (!referencesMap.has(ref.noteId)) {
          referencesMap.set(ref.noteId, []);
        }
        referencesMap.get(ref.noteId).push(decoded);
      }
    });
    return notes.map((note) => this.processNote(note, notebookMap, referencesMap));
  }
  generateNoteFilename(note, index) {
    let filename = "";
    if (note.formattedTitle) {
      filename = note.formattedTitle;
    } else if (note.references.length > 0) {
      filename = note.references[0].formatted;
    } else {
      filename = `note-${note.id}`;
    }
    if (index > 1) {
      filename += `-${index}`;
    }
    return this.sanitizeFilename(filename) + ".md";
  }
  processNote(note, notebookMap, referencesMap) {
    const notebook = notebookMap.get(note.notebookExternalId) || null;
    const references = referencesMap.get(note.id) || [];
    const formattedTitle = this.generateNoteTitle(note, references);
    const sanitizedFilename = this.sanitizeFilename(formattedTitle);
    return {
      ...note,
      notebook,
      references,
      formattedTitle,
      sanitizedFilename
    };
  }
  generateNoteTitle(note, references) {
    if (note.contentRichText) {
      const title = this.extractTitleFromContent(note.contentRichText);
      if (title)
        return title;
    }
    if (references.length > 0) {
      return references[0].formatted;
    }
    const noteType = note.kind === 0 ? "Note" : note.kind === 1 ? "Highlight" : "Annotation";
    return `${noteType} ${note.id}`;
  }
  extractTitleFromContent(content) {
    const cleanText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanText)
      return null;
    const firstLine = cleanText.split(/[\\n\\r]/)[0].trim();
    if (firstLine.length > 50) {
      return firstLine.substring(0, 47) + "...";
    }
    return firstLine || null;
  }
  sanitizeFilename(name) {
    return name.replace(/[<>:\"/\\|?*]/g, "-").replace(/\\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 100) || "untitled";
  }
  close() {
    this.database.close();
  }
}

// src/file-organizer.ts
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
var DEFAULT_FILE_OPTIONS = {
  baseDir: "./exported-notes",
  organizeByNotebooks: true,
  includeDateFolders: false,
  flattenSingleNotebook: false,
  maxFilenameLength: 100,
  fileExtension: ".md",
  createIndexFiles: true
};

class FileOrganizer {
  options;
  createdDirs = new Set;
  constructor(options = {}) {
    this.options = { ...DEFAULT_FILE_OPTIONS, ...options };
  }
  async planDirectoryStructure(notebookGroups) {
    const structure = {
      baseDir: this.options.baseDir,
      notebookDirs: [],
      totalFiles: 0,
      indexFiles: []
    };
    if (this.options.createIndexFiles) {
      structure.indexFiles.push(join(this.options.baseDir, "README.md"));
    }
    for (const group of notebookGroups) {
      const notebookDir = this.getNotebookDirectory(group);
      structure.notebookDirs.push(notebookDir);
      structure.totalFiles += group.notes.length;
      if (this.options.createIndexFiles) {
        structure.indexFiles.push(join(notebookDir, "README.md"));
      }
    }
    return structure;
  }
  getNotebookDirectory(group) {
    if (!this.options.organizeByNotebooks) {
      return this.options.baseDir;
    }
    const notebookName = group.sanitizedFolderName;
    return join(this.options.baseDir, notebookName);
  }
  generateFilePath(note, group, index = 1) {
    const directory = this.getNotebookDirectory(group);
    let filename = this.generateSafeFilename(note, index);
    let finalDirectory = directory;
    if (this.options.includeDateFolders) {
      const date = new Date(note.createdDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      finalDirectory = join(directory, `${year}-${month}`);
    }
    const fullPath = join(finalDirectory, filename);
    const relativePath = fullPath.replace(this.options.baseDir + "/", "");
    return {
      fullPath,
      directory: finalDirectory,
      filename: filename.replace(this.options.fileExtension, ""),
      relativePath,
      exists: existsSync(fullPath)
    };
  }
  async ensureDirectory(dirPath) {
    if (!this.createdDirs.has(dirPath) && !existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
      this.createdDirs.add(dirPath);
    }
  }
  async writeFile(fileInfo, content) {
    await this.ensureDirectory(fileInfo.directory);
    await writeFile(fileInfo.fullPath, content, "utf-8");
  }
  generateMainIndex(notebookGroups, stats) {
    const lines = [
      "# Exported Logos Notes",
      "",
      `**Exported on:** ${new Date().toISOString()}  `,
      `**Total Notes:** ${stats.totalNotes}  `,
      `**Total Notebooks:** ${notebookGroups.length}  `,
      "",
      "## \uD83D\uDCDA Notebooks",
      ""
    ];
    for (const group of notebookGroups) {
      const notebookName = group.notebook?.title || "Orphaned Notes";
      const noteCount = group.notes.length;
      const relativePath = group.sanitizedFolderName;
      lines.push(`- [**${notebookName}**](./${relativePath}/README.md) (${noteCount} notes)`);
    }
    lines.push("");
    lines.push("## \uD83D\uDCCA Statistics");
    lines.push("");
    lines.push(`- **Notes with Content:** ${stats.notesWithContent}`);
    lines.push(`- **Notes with References:** ${stats.notesWithReferences}`);
    lines.push(`- **Orphaned Notes:** ${stats.orphanedNotes}`);
    lines.push("");
    lines.push("---");
    lines.push("*Generated by Logos Notes Exporter*");
    return lines.join(`
`);
  }
  generateNotebookIndex(group) {
    const notebookTitle = group.notebook?.title || "Orphaned Notes";
    const lines = [
      `# ${notebookTitle}`,
      "",
      `**Notes:** ${group.notes.length}  `,
      ""
    ];
    if (group.notebook) {
      lines.push(`**Created:** ${new Date(group.notebook.createdDate).toLocaleDateString()}  `);
      lines.push(`**Notebook ID:** ${group.notebook.externalId}  `);
      lines.push("");
    }
    lines.push("## \uD83D\uDCDD Notes");
    lines.push("");
    const textNotes = group.notes.filter((n) => n.kind === 0);
    const highlights = group.notes.filter((n) => n.kind === 1);
    const annotations = group.notes.filter((n) => n.kind === 2);
    if (textNotes.length > 0) {
      lines.push("### \u270D\uFE0F Text Notes");
      lines.push("");
      textNotes.forEach((note) => {
        const filename = this.generateSafeFilename(note, 1);
        const title = note.formattedTitle;
        const references = note.references.map((r) => r.formatted).join(", ");
        lines.push(`- [**${title}**](./${filename})${references ? ` - ${references}` : ""}`);
      });
      lines.push("");
    }
    if (highlights.length > 0) {
      lines.push("### \uD83C\uDFA8 Highlights");
      lines.push("");
      highlights.forEach((note) => {
        const filename = this.generateSafeFilename(note, 1);
        const title = note.formattedTitle;
        const references = note.references.map((r) => r.formatted).join(", ");
        lines.push(`- [**${title}**](./${filename})${references ? ` - ${references}` : ""}`);
      });
      lines.push("");
    }
    if (annotations.length > 0) {
      lines.push("### \uD83D\uDCCB Annotations");
      lines.push("");
      annotations.forEach((note) => {
        const filename = this.generateSafeFilename(note, 1);
        const title = note.formattedTitle;
        const references = note.references.map((r) => r.formatted).join(", ");
        lines.push(`- [**${title}**](./${filename})${references ? ` - ${references}` : ""}`);
      });
      lines.push("");
    }
    lines.push("---");
    lines.push(`*${group.notes.length} notes in this notebook*`);
    return lines.join(`
`);
  }
  generateSafeFilename(note, index) {
    let filename = "";
    if (note.formattedTitle && note.formattedTitle.trim()) {
      filename = note.formattedTitle;
    } else if (note.references.length > 0 && note.references[0]) {
      filename = note.references[0].formatted;
    } else {
      const noteType = note.kind === 0 ? "note" : note.kind === 1 ? "highlight" : "annotation";
      filename = `${noteType}-${note.id}`;
    }
    if (index > 1) {
      filename += `-${index}`;
    }
    filename = this.sanitizeFilename(filename);
    return filename + this.options.fileExtension;
  }
  sanitizeFilename(name) {
    return name.replace(/[<>:\"/\\\\|?*]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, this.options.maxFilenameLength).toLowerCase() || "untitled";
  }
  resolveFilenameConflicts(notes, group) {
    const fileMap = new Map;
    const usedFilenames = new Set;
    for (const note of notes) {
      let index = 1;
      let fileInfo;
      do {
        fileInfo = this.generateFilePath(note, group, index);
        index++;
      } while (usedFilenames.has(fileInfo.fullPath) && index <= 100);
      usedFilenames.add(fileInfo.fullPath);
      fileMap.set(note, fileInfo);
    }
    return fileMap;
  }
  getFileOperationSummary(notebookGroups) {
    let totalDirectories = 1;
    let totalFiles = 0;
    let totalIndexFiles = 0;
    if (this.options.createIndexFiles) {
      totalIndexFiles++;
    }
    for (const group of notebookGroups) {
      totalDirectories++;
      totalFiles += group.notes.length;
      if (this.options.createIndexFiles) {
        totalIndexFiles++;
      }
      if (this.options.includeDateFolders) {
        const uniqueDates = new Set(group.notes.map((note) => {
          const date = new Date(note.createdDate);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        }));
        totalDirectories += uniqueDates.size;
      }
    }
    const avgNoteSize = 2048;
    const avgIndexSize = 1024;
    const estimatedBytes = totalFiles * avgNoteSize + totalIndexFiles * avgIndexSize;
    const estimatedSize = this.formatBytes(estimatedBytes);
    return {
      totalDirectories,
      totalFiles,
      totalIndexFiles,
      estimatedSize
    };
  }
  formatBytes(bytes) {
    if (bytes === 0)
      return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  getOptions() {
    return { ...this.options };
  }
}

// node_modules/fast-xml-parser/src/util.js
var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
var regexName = new RegExp("^" + nameRegexp + "$");
function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0;index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}
var isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === "undefined");
};
function isExist(v) {
  return typeof v !== "undefined";
}

// node_modules/fast-xml-parser/src/validator.js
var defaultOptions = {
  allowBooleanAttributes: false,
  unpairedTags: []
};
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions, options);
  const tags = [];
  let tagFound = false;
  let reachedRoot = false;
  if (xmlData[0] === "\uFEFF") {
    xmlData = xmlData.substr(1);
  }
  for (let i = 0;i < xmlData.length; i++) {
    if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err)
        return i;
    } else if (xmlData[i] === "<") {
      let tagStartPos = i;
      i++;
      if (xmlData[i] === "!") {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === "/") {
          closingTag = true;
          i++;
        }
        let tagName = "";
        for (;i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "\t" && xmlData[i] !== `
` && xmlData[i] !== "\r"; i++) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        if (tagName[tagName.length - 1] === "/") {
          tagName = tagName.substring(0, tagName.length - 1);
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
        }
        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;
        if (attrStr[attrStr.length - 1] === "/") {
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
          } else {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject("InvalidTag", "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.", getLineNumberForPosition(xmlData, tagStartPos));
            }
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }
          if (reachedRoot === true) {
            return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
          } else if (options.unpairedTags.indexOf(tagName) !== -1) {} else {
            tags.push({ tagName, tagStartPos });
          }
          tagFound = true;
        }
        for (i++;i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            if (xmlData[i + 1] === "!") {
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === "?") {
              i = readPI(xmlData, ++i);
              if (i.err)
                return i;
            } else {
              break;
            }
          } else if (xmlData[i] === "&") {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          } else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        }
        if (xmlData[i] === "<") {
          i--;
        }
      }
    } else {
      if (isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }
  if (!tagFound) {
    return getErrorObject("InvalidXml", "Start tag expected.", 1);
  } else if (tags.length == 1) {
    return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  } else if (tags.length > 0) {
    return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
  }
  return true;
}
function isWhiteSpace(char) {
  return char === " " || char === "\t" || char === `
` || char === "\r";
}
function readPI(xmlData, i) {
  const start = i;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] == "?" || xmlData[i] == " ") {
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === "xml") {
        return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}
function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
    for (i += 3;i < xmlData.length; i++) {
      if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
    let angleBracketsCount = 1;
    for (i += 8;i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        angleBracketsCount++;
      } else if (xmlData[i] === ">") {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
    for (i += 8;i < xmlData.length; i++) {
      if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  }
  return i;
}
var doubleQuote = '"';
var singleQuote = "'";
function readAttributeStr(xmlData, i) {
  let attrStr = "";
  let startChar = "";
  let tagClosed = false;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === "") {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {} else {
        startChar = "";
      }
    } else if (xmlData[i] === ">") {
      if (startChar === "") {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== "") {
    return false;
  }
  return {
    value: attrStr,
    index: i,
    tagClosed
  };
}
var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function validateAttributeString(attrStr, options) {
  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};
  for (let i = 0;i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
    }
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      attrNames[attrName] = 1;
    } else {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
    }
  }
  return true;
}
function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === "x") {
    i++;
    re = /[\da-fA-F]/;
  }
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === ";")
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  i++;
  if (xmlData[i] === ";")
    return -1;
  if (xmlData[i] === "#") {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (;i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ";")
      break;
    return -1;
  }
  return i;
}
function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col
    }
  };
}
function validateAttrName(attrName) {
  return isName(attrName);
}
function validateTagName(tagname) {
  return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  };
}
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

// node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var defaultOptions2 = {
  preserveOrder: false,
  attributeNamePrefix: "@_",
  attributesGroupName: false,
  textNodeName: "#text",
  ignoreAttributes: true,
  removeNSPrefix: false,
  allowBooleanAttributes: false,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  cdataPropName: false,
  numberParseOptions: {
    hex: true,
    leadingZeros: true,
    eNotation: true
  },
  tagValueProcessor: function(tagName, val) {
    return val;
  },
  attributeValueProcessor: function(attrName, val) {
    return val;
  },
  stopNodes: [],
  alwaysCreateTextNode: false,
  isArray: () => false,
  commentPropName: false,
  unpairedTags: [],
  processEntities: true,
  htmlEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
  transformTagName: false,
  transformAttributeName: false,
  updateTag: function(tagName, jPath, attrs) {
    return tagName;
  },
  captureMetaData: false
};
var buildOptions = function(options) {
  return Object.assign({}, defaultOptions2, options);
};

// node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var METADATA_SYMBOL;
if (typeof Symbol !== "function") {
  METADATA_SYMBOL = "@@xmlMetadata";
} else {
  METADATA_SYMBOL = Symbol("XML Node Metadata");
}

class XmlNode {
  constructor(tagname) {
    this.tagname = tagname;
    this.child = [];
    this[":@"] = {};
  }
  add(key, val) {
    if (key === "__proto__")
      key = "#__proto__";
    this.child.push({ [key]: val });
  }
  addChild(node, startIndex) {
    if (node.tagname === "__proto__")
      node.tagname = "#__proto__";
    if (node[":@"] && Object.keys(node[":@"]).length > 0) {
      this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
    } else {
      this.child.push({ [node.tagname]: node.child });
    }
    if (startIndex !== undefined) {
      this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
    }
  }
  static getMetaDataSymbol() {
    return METADATA_SYMBOL;
  }
}

// node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
function readDocType(xmlData, i) {
  const entities = {};
  if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
    i = i + 9;
    let angleBracketsCount = 1;
    let hasBody = false, comment = false;
    let exp = "";
    for (;i < xmlData.length; i++) {
      if (xmlData[i] === "<" && !comment) {
        if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
          i += 7;
          let entityName, val;
          [entityName, val, i] = readEntityExp(xmlData, i + 1);
          if (val.indexOf("&") === -1)
            entities[entityName] = {
              regx: RegExp(`&${entityName};`, "g"),
              val
            };
        } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
          i += 8;
          const { index } = readElementExp(xmlData, i + 1);
          i = index;
        } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
          i += 8;
        } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
          i += 9;
          const { index } = readNotationExp(xmlData, i + 1);
          i = index;
        } else if (hasSeq(xmlData, "!--", i))
          comment = true;
        else
          throw new Error(`Invalid DOCTYPE`);
        angleBracketsCount++;
        exp = "";
      } else if (xmlData[i] === ">") {
        if (comment) {
          if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
            comment = false;
            angleBracketsCount--;
          }
        } else {
          angleBracketsCount--;
        }
        if (angleBracketsCount === 0) {
          break;
        }
      } else if (xmlData[i] === "[") {
        hasBody = true;
      } else {
        exp += xmlData[i];
      }
    }
    if (angleBracketsCount !== 0) {
      throw new Error(`Unclosed DOCTYPE`);
    }
  } else {
    throw new Error(`Invalid Tag instead of DOCTYPE`);
  }
  return { entities, i };
}
var skipWhitespace = (data, index) => {
  while (index < data.length && /\s/.test(data[index])) {
    index++;
  }
  return index;
};
function readEntityExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let entityName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
    entityName += xmlData[i];
    i++;
  }
  validateEntityName(entityName);
  i = skipWhitespace(xmlData, i);
  if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
    throw new Error("External entities are not supported");
  } else if (xmlData[i] === "%") {
    throw new Error("Parameter entities are not supported");
  }
  let entityValue = "";
  [i, entityValue] = readIdentifierVal(xmlData, i, "entity");
  i--;
  return [entityName, entityValue, i];
}
function readNotationExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let notationName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i])) {
    notationName += xmlData[i];
    i++;
  }
  validateEntityName(notationName);
  i = skipWhitespace(xmlData, i);
  const identifierType = xmlData.substring(i, i + 6).toUpperCase();
  if (identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
    throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
  }
  i += identifierType.length;
  i = skipWhitespace(xmlData, i);
  let publicIdentifier = null;
  let systemIdentifier = null;
  if (identifierType === "PUBLIC") {
    [i, publicIdentifier] = readIdentifierVal(xmlData, i, "publicIdentifier");
    i = skipWhitespace(xmlData, i);
    if (xmlData[i] === '"' || xmlData[i] === "'") {
      [i, systemIdentifier] = readIdentifierVal(xmlData, i, "systemIdentifier");
    }
  } else if (identifierType === "SYSTEM") {
    [i, systemIdentifier] = readIdentifierVal(xmlData, i, "systemIdentifier");
    if (!systemIdentifier) {
      throw new Error("Missing mandatory system identifier for SYSTEM notation");
    }
  }
  return { notationName, publicIdentifier, systemIdentifier, index: --i };
}
function readIdentifierVal(xmlData, i, type) {
  let identifierVal = "";
  const startChar = xmlData[i];
  if (startChar !== '"' && startChar !== "'") {
    throw new Error(`Expected quoted string, found "${startChar}"`);
  }
  i++;
  while (i < xmlData.length && xmlData[i] !== startChar) {
    identifierVal += xmlData[i];
    i++;
  }
  if (xmlData[i] !== startChar) {
    throw new Error(`Unterminated ${type} value`);
  }
  i++;
  return [i, identifierVal];
}
function readElementExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let elementName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i])) {
    elementName += xmlData[i];
    i++;
  }
  if (!validateEntityName(elementName)) {
    throw new Error(`Invalid element name: "${elementName}"`);
  }
  i = skipWhitespace(xmlData, i);
  let contentModel = "";
  if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i))
    i += 4;
  else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i))
    i += 2;
  else if (xmlData[i] === "(") {
    i++;
    while (i < xmlData.length && xmlData[i] !== ")") {
      contentModel += xmlData[i];
      i++;
    }
    if (xmlData[i] !== ")") {
      throw new Error("Unterminated content model");
    }
  } else {
    throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
  }
  return {
    elementName,
    contentModel: contentModel.trim(),
    index: i
  };
}
function hasSeq(data, seq, i) {
  for (let j = 0;j < seq.length; j++) {
    if (seq[j] !== data[i + j + 1])
      return false;
  }
  return true;
}
function validateEntityName(name) {
  if (isName(name))
    return name;
  else
    throw new Error(`Invalid entity name ${name}`);
}

// node_modules/strnum/strnum.js
var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
var consider = {
  hex: true,
  leadingZeros: true,
  decimalPoint: ".",
  eNotation: true
};
function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== "string")
    return str;
  let trimmedStr = str.trim();
  if (options.skipLike !== undefined && options.skipLike.test(trimmedStr))
    return str;
  else if (str === "0")
    return 0;
  else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
  } else if (trimmedStr.search(/.+[eE].+/) !== -1) {
    return resolveEnotation(str, trimmedStr, options);
  } else {
    const match = numRegex.exec(trimmedStr);
    if (match) {
      const sign = match[1] || "";
      const leadingZeros = match[2];
      let numTrimmedByZeros = trimZeros(match[3]);
      const decimalAdjacentToLeadingZeros = sign ? str[leadingZeros.length + 1] === "." : str[leadingZeros.length] === ".";
      if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) {
        return str;
      } else {
        const num = Number(trimmedStr);
        const parsedStr = String(num);
        if (num === 0)
          return num;
        if (parsedStr.search(/[eE]/) !== -1) {
          if (options.eNotation)
            return num;
          else
            return str;
        } else if (trimmedStr.indexOf(".") !== -1) {
          if (parsedStr === "0")
            return num;
          else if (parsedStr === numTrimmedByZeros)
            return num;
          else if (parsedStr === `${sign}${numTrimmedByZeros}`)
            return num;
          else
            return str;
        }
        let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
        if (leadingZeros) {
          return n === parsedStr || sign + n === parsedStr ? num : str;
        } else {
          return n === parsedStr || n === sign + parsedStr ? num : str;
        }
      }
    } else {
      return str;
    }
  }
}
var eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str, trimmedStr, options) {
  if (!options.eNotation)
    return str;
  const notation = trimmedStr.match(eNotationRegx);
  if (notation) {
    let sign = notation[1] || "";
    const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
    const leadingZeros = notation[2];
    const eAdjacentToLeadingZeros = sign ? str[leadingZeros.length + 1] === eChar : str[leadingZeros.length] === eChar;
    if (leadingZeros.length > 1 && eAdjacentToLeadingZeros)
      return str;
    else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
      return Number(trimmedStr);
    } else if (options.leadingZeros && !eAdjacentToLeadingZeros) {
      trimmedStr = (notation[1] || "") + notation[3];
      return Number(trimmedStr);
    } else
      return str;
  } else {
    return str;
  }
}
function trimZeros(numStr) {
  if (numStr && numStr.indexOf(".") !== -1) {
    numStr = numStr.replace(/0+$/, "");
    if (numStr === ".")
      numStr = "0";
    else if (numStr[0] === ".")
      numStr = "0" + numStr;
    else if (numStr[numStr.length - 1] === ".")
      numStr = numStr.substring(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}
function parse_int(numStr, base) {
  if (parseInt)
    return parseInt(numStr, base);
  else if (Number.parseInt)
    return Number.parseInt(numStr, base);
  else if (window && window.parseInt)
    return window.parseInt(numStr, base);
  else
    throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}

// node_modules/fast-xml-parser/src/ignoreAttributes.js
function getIgnoreAttributesFn(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

// node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
class OrderedObjParser {
  constructor(options) {
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      apos: { regex: /&(apos|#39|#x27);/g, val: "'" },
      gt: { regex: /&(gt|#62|#x3E);/g, val: ">" },
      lt: { regex: /&(lt|#60|#x3C);/g, val: "<" },
      quot: { regex: /&(quot|#34|#x22);/g, val: '"' }
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
    this.htmlEntities = {
      space: { regex: /&(nbsp|#160);/g, val: " " },
      cent: { regex: /&(cent|#162);/g, val: "\xA2" },
      pound: { regex: /&(pound|#163);/g, val: "\xA3" },
      yen: { regex: /&(yen|#165);/g, val: "\xA5" },
      euro: { regex: /&(euro|#8364);/g, val: "\u20AC" },
      copyright: { regex: /&(copy|#169);/g, val: "\xA9" },
      reg: { regex: /&(reg|#174);/g, val: "\xAE" },
      inr: { regex: /&(inr|#8377);/g, val: "\u20B9" },
      num_dec: { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 10)) },
      num_hex: { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 16)) }
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
  }
}
function addExternalEntities(externalEntities) {
  const entKeys = Object.keys(externalEntities);
  for (let i = 0;i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
      regex: new RegExp("&" + ent + ";", "g"),
      val: externalEntities[ent]
    };
  }
}
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== undefined) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if (val.length > 0) {
      if (!escapeEntities)
        val = this.replaceEntitiesValue(val);
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if (newval === null || newval === undefined) {
        return val;
      } else if (typeof newval !== typeof val || newval !== val) {
        return newval;
      } else if (this.options.trimValues) {
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      } else {
        const trimmedVal = val.trim();
        if (trimmedVal === val) {
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          return val;
        }
      }
    }
  }
}
function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(":");
    const prefix = tagname.charAt(0) === "/" ? "/" : "";
    if (tags[0] === "xmlns") {
      return "";
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}
var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length;
    const attrs = {};
    for (let i = 0;i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPath)) {
        continue;
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if (aName === "__proto__")
          aName = "#__proto__";
        if (oldVal !== undefined) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if (newVal === null || newVal === undefined) {
            attrs[aName] = oldVal;
          } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
            attrs[aName] = newVal;
          } else {
            attrs[aName] = parseValue(oldVal, this.options.parseAttributeValue, this.options.numberParseOptions);
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
var parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, `
`);
  const xmlObj = new XmlNode("!xml");
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for (let i = 0;i < xmlData.length; i++) {
    const ch = xmlData[i];
    if (ch === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i + 2, closeIndex).trim();
        if (this.options.removeNSPrefix) {
          const colonIndex = tagName.indexOf(":");
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode) {
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }
        const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
        if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0;
        if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
          propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
          this.tagsNodeStack.pop();
        } else {
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);
        currentNode = this.tagsNodeStack.pop();
        textData = "";
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        let tagData = readTagExp(xmlData, i, false, "?>");
        if (!tagData)
          throw new Error("Pi Tag is not closed.");
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {} else {
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath, i);
        }
        i = tagData.closeIndex + 1;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
        if (this.options.commentPropName) {
          const comment = xmlData.substring(i + 4, endIndex - 2);
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
          currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
        }
        i = endIndex;
      } else if (xmlData.substr(i + 1, 2) === "!D") {
        const result = readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9, closeIndex);
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if (val == undefined)
          val = "";
        if (this.options.cdataPropName) {
          currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
        } else {
          currentNode.add(this.options.textNodeName, val);
        }
        i = closeIndex + 2;
      } else {
        let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
        let tagName = result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode && textData) {
          if (currentNode.tagname !== "!xml") {
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }
        const lastTag = currentNode;
        if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if (tagName !== xmlObj.tagname) {
          jPath += jPath ? "." + tagName : tagName;
        }
        const startIndex = i;
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            i = result.closeIndex;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            i = result.closeIndex;
          } else {
            const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if (!result2)
              throw new Error(`Unexpected end of ${rawTagName}`);
            i = result2.i;
            tagContent = result2.tagContent;
          }
          const childNode = new XmlNode(tagName);
          if (tagName !== tagExp && attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if (tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          this.addChild(currentNode, childNode, jPath, startIndex);
        } else {
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            const childNode = new XmlNode(tagName);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          } else {
            const childNode = new XmlNode(tagName);
            this.tagsNodeStack.push(currentNode);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};
function addChild(currentNode, childNode, jPath, startIndex) {
  if (!this.options.captureMetaData)
    startIndex = undefined;
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
  if (result === false) {} else if (typeof result === "string") {
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  } else {
    currentNode.addChild(childNode, startIndex);
  }
}
var replaceEntitiesValue = function(val) {
  if (this.options.processEntities) {
    for (let entityName in this.docTypeEntities) {
      const entity = this.docTypeEntities[entityName];
      val = val.replace(entity.regx, entity.val);
    }
    for (let entityName in this.lastEntities) {
      const entity = this.lastEntities[entityName];
      val = val.replace(entity.regex, entity.val);
    }
    if (this.options.htmlEntities) {
      for (let entityName in this.htmlEntities) {
        const entity = this.htmlEntities[entityName];
        val = val.replace(entity.regex, entity.val);
      }
    }
    val = val.replace(this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
};
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) {
    if (isLeafNode === undefined)
      isLeafNode = currentNode.child.length === 0;
    textData = this.parseTextData(textData, currentNode.tagname, jPath, false, currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false, isLeafNode);
    if (textData !== undefined && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}
function isItStopNode(stopNodes, jPath, currentTagName) {
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if (allNodesExp === stopNodeExp || jPath === stopNodeExp)
      return true;
  }
  return false;
}
function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
  let attrBoundary;
  let tagExp = "";
  for (let index = i;index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
      if (ch === attrBoundary)
        attrBoundary = "";
    } else if (ch === '"' || ch === "'") {
      attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if (closingChar[1]) {
        if (xmlData[index + 1] === closingChar[1]) {
          return {
            data: tagExp,
            index
          };
        }
      } else {
        return {
          data: tagExp,
          index
        };
      }
    } else if (ch === "\t") {
      ch = " ";
    }
    tagExp += ch;
  }
}
function findClosingIndex(xmlData, str, i, errMsg) {
  const closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}
function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
  const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
  if (!result)
    return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if (separatorIndex !== -1) {
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }
  const rawTagName = tagName;
  if (removeNSPrefix) {
    const colonIndex = tagName.indexOf(":");
    if (colonIndex !== -1) {
      tagName = tagName.substr(colonIndex + 1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }
  return {
    tagName,
    tagExp,
    closeIndex,
    attrExpPresent,
    rawTagName
  };
}
function readStopNodeData(xmlData, tagName, i) {
  const startIndex = i;
  let openTagCount = 1;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
        let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
        if (closeTagName === tagName) {
          openTagCount--;
          if (openTagCount === 0) {
            return {
              tagContent: xmlData.substring(startIndex, i),
              i: closeIndex
            };
          }
        }
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
        i = closeIndex;
      } else {
        const tagData = readTagExp(xmlData, i, ">");
        if (tagData) {
          const openTagName = tagData && tagData.tagName;
          if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
            openTagCount++;
          }
          i = tagData.closeIndex;
        }
      }
    }
  }
}
function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === "string") {
    const newval = val.trim();
    if (newval === "true")
      return true;
    else if (newval === "false")
      return false;
    else
      return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return "";
    }
  }
}

// node_modules/fast-xml-parser/src/xmlparser/node2json.js
var METADATA_SYMBOL2 = XmlNode.getMetaDataSymbol();
function prettify(node, options) {
  return compress(node, options);
}
function compress(arr, options, jPath) {
  let text;
  const compressedObj = {};
  for (let i = 0;i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    let newJpath = "";
    if (jPath === undefined)
      newJpath = property;
    else
      newJpath = jPath + "." + property;
    if (property === options.textNodeName) {
      if (text === undefined)
        text = tagObj[property];
      else
        text += "" + tagObj[property];
    } else if (property === undefined) {
      continue;
    } else if (tagObj[property]) {
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[METADATA_SYMBOL2] !== undefined) {
        val[METADATA_SYMBOL2] = tagObj[METADATA_SYMBOL2];
      }
      if (tagObj[":@"]) {
        assignAttributes(val, tagObj[":@"], newJpath, options);
      } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode) {
        val = val[options.textNodeName];
      } else if (Object.keys(val).length === 0) {
        if (options.alwaysCreateTextNode)
          val[options.textNodeName] = "";
        else
          val = "";
      }
      if (compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
        if (!Array.isArray(compressedObj[property])) {
          compressedObj[property] = [compressedObj[property]];
        }
        compressedObj[property].push(val);
      } else {
        if (options.isArray(property, newJpath, isLeaf)) {
          compressedObj[property] = [val];
        } else {
          compressedObj[property] = val;
        }
      }
    }
  }
  if (typeof text === "string") {
    if (text.length > 0)
      compressedObj[options.textNodeName] = text;
  } else if (text !== undefined)
    compressedObj[options.textNodeName] = text;
  return compressedObj;
}
function propName(obj) {
  const keys = Object.keys(obj);
  for (let i = 0;i < keys.length; i++) {
    const key = keys[i];
    if (key !== ":@")
      return key;
  }
}
function assignAttributes(obj, attrMap, jpath, options) {
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length;
    for (let i = 0;i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [attrMap[atrrName]];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}
function isLeafTag(obj, options) {
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  if (propCount === 0) {
    return true;
  }
  if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
    return true;
  }
  return false;
}

// node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
class XMLParser {
  constructor(options) {
    this.externalEntities = {};
    this.options = buildOptions(options);
  }
  parse(xmlData, validationOption) {
    if (typeof xmlData === "string") {} else if (xmlData.toString) {
      xmlData = xmlData.toString();
    } else {
      throw new Error("XML data is accepted in String or Bytes[] form.");
    }
    if (validationOption) {
      if (validationOption === true)
        validationOption = {};
      const result = validate(xmlData, validationOption);
      if (result !== true) {
        throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
      }
    }
    const orderedObjParser = new OrderedObjParser(this.options);
    orderedObjParser.addExternalEntities(this.externalEntities);
    const orderedResult = orderedObjParser.parseXml(xmlData);
    if (this.options.preserveOrder || orderedResult === undefined)
      return orderedResult;
    else
      return prettify(orderedResult, this.options);
  }
  addEntity(key, value) {
    if (value.indexOf("&") !== -1) {
      throw new Error("Entity value can't have '&'");
    } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    } else if (value === "&") {
      throw new Error("An entity with value '&' is not permitted");
    } else {
      this.externalEntities[key] = value;
    }
  }
  static getMetaDataSymbol() {
    return XmlNode.getMetaDataSymbol();
  }
}

// src/unicode-cleaner.ts
var DEFAULT_OPTIONS = {
  removeZeroWidth: true,
  removeControlChars: true,
  removeFootnoteMarkers: true,
  enableAdvancedCleaning: true
};

class UnicodeCleaner {
  options;
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  cleanText(text) {
    if (!text) {
      return text;
    }
    let cleaned = text;
    if (this.options.removeZeroWidth) {
      cleaned = this.removeZeroWidthCharacters(cleaned);
    }
    if (this.options.removeControlChars) {
      cleaned = this.removeControlCharacters(cleaned);
    }
    if (this.options.removeFootnoteMarkers) {
      cleaned = this.removeFootnoteMarkers(cleaned);
    }
    if (this.options.enableAdvancedCleaning) {
      cleaned = this.applyAdvancedCleaning(cleaned);
    }
    return cleaned;
  }
  removeZeroWidthCharacters(text) {
    const problematicChars = [
      "\u200B",
      "\u200C",
      "\u200D",
      "\u200E",
      "\u200F",
      "\u2060",
      "\uFEFF",
      "\xAD",
      "\u061C",
      "\u180E",
      "\u2061",
      "\u2062",
      "\u2063",
      "\u2064"
    ];
    for (const char of problematicChars) {
      text = text.replace(new RegExp(char, "g"), "");
    }
    return text;
  }
  removeControlCharacters(text) {
    return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
  }
  removeFootnoteMarkers(text) {
    const crossRefPatterns = [
      /\b[a-z](?:true|false|noble|just|pure|lovely|whatever|things)\b/gi,
      /\b[a-z](?:the|and|that|with|will|shall|have|was|were|are)\b/gi,
      /\b[a-z](?:you|your|his|her|their|who|which|when|where|what)\b/gi,
      /\b[a-z](?:how|why|all|every|any|some|many|much|into|unto)\b/gi,
      /\b[a-z](?:upon|from|before|after|above|below|through|between)\b/gi,
      /\b[a-z](?:Lord|God|Jesus|Christ|Spirit|Father|Son|Holy)\b/gi,
      /\b[a-z](?:gospel|faith|grace|mercy|love|hope|peace|joy)\b/gi,
      /\b[a-z](?:salvation|righteousness|holiness|blessing|covenant)\b/gi,
      /\b[a-z](?:indeed|wages|cries|hearken|unto|behold|verily)\b/gi,
      /\b\d+(?:Sabaoth|the|and|that|will|shall|Lord|God|unto|into)\b/gi,
      /\b\d+(?:indeed|wages|cries|behold|verily|hearken|blessed)\b/gi,
      /\b[\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C3\u03C4\u03C5\u03C6\u03C7\u03C8\u03C9](?:the|and|that|will|shall)\b/gi,
      /\b[\u05D0\u05D1\u05D2\u05D3\u05D4\u05D5\u05D6\u05D7\u05D8\u05D9\u05DB\u05DC\u05DE\u05E0\u05E1\u05E2\u05E4\u05E6\u05E7\u05E8\u05E9\u05EA](?:the|and|that|will|shall)\b/gi,
      /\b[*\u2020\u2021\u00A7\u00B6#](?:the|and|that|will|shall|Lord|God)\b/gi,
      /\b[\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079\u1D43\u1D47\u1D9C\u1D48\u1D49\u1DA0\u1D4D\u02B0\u2071\u02B2\u1D4F\u02E1\u1D50\u207F\u1D52\u1D56\u02B3\u02E2\u1D57\u1D58\u1D5B\u02B7\u02E3\u02B8\u1DBB](?:the|and|that|will|shall)\b/gi
    ];
    for (const pattern of crossRefPatterns) {
      text = text.replace(pattern, (match) => {
        return match.slice(1);
      });
    }
    return text;
  }
  applyAdvancedCleaning(text) {
    let cleaned = text;
    cleaned = cleaned.replace(/[\ufeff\u200b-\u200f\u2060]+(.?)[\ufeff\u200b-\u200f\u2060]+/g, "$1");
    cleaned = cleaned.replace(/\b([a-z])([A-Z][a-z]+)\b/g, "$2");
    cleaned = cleaned.replace(/\b(?![IiAa])[a-z]\b/g, "");
    cleaned = cleaned.replace(/\s{2,}/g, " ");
    cleaned = cleaned.replace(/\s+([.,;:!?])/g, "$1");
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/\(\s*\)/g, "");
    cleaned = cleaned.replace(/\[\s*\]/g, "");
    cleaned = cleaned.replace(/\{\s*\}/g, "");
    return cleaned;
  }
  cleanXamlText(xamlText) {
    if (!xamlText)
      return xamlText;
    let cleaned = xamlText.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code))).replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    cleaned = this.cleanText(cleaned);
    return cleaned;
  }
  cleanExtractedText(texts) {
    return texts.map((text) => this.cleanXamlText(text)).filter((text) => text && text.trim() !== "");
  }
}
function cleanXamlText(xamlText) {
  const cleaner = new UnicodeCleaner;
  return cleaner.cleanXamlText(xamlText);
}

// src/xaml-converter.ts
var DEFAULT_OPTIONS2 = {
  headingSizes: [24, 20, 18, 16, 15, 14, 13],
  monospaceFontName: "Courier New",
  blockQuoteLineThickness: 3,
  horizontalLineThickness: 3,
  ignoreUnknownElements: true
};

class XamlToMarkdownConverter {
  options;
  parser;
  unicodeCleaner;
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS2, ...options };
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      removeNSPrefix: true,
      parseAttributeValue: false,
      trimValues: true,
      processEntities: true
    });
    this.unicodeCleaner = new UnicodeCleaner;
  }
  isXamlElement(value) {
    return value !== null && typeof value === "object";
  }
  convertToMarkdown(xamlContent) {
    try {
      if (!xamlContent || xamlContent.trim() === "") {
        return "";
      }
      const cleanedXaml = this.cleanXamlContent(xamlContent);
      if (!cleanedXaml.trim()) {
        return "";
      }
      const parsed = this.parser.parse(cleanedXaml);
      const markdown = this.processElement(parsed);
      return this.normalizeMarkdown(markdown);
    } catch (error) {
      if (this.options.ignoreUnknownElements) {
        return this.extractPlainText(xamlContent);
      }
      throw new Error(`XAML conversion failed: ${error}`);
    }
  }
  cleanXamlContent(xaml) {
    let cleaned = xaml.replace(/<\?xml[^>]*\?>/gi, "");
    cleaned = cleaned.replace(/xmlns[^=]*="[^"]*"/gi, "");
    cleaned = cleaned.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
    return cleaned.trim();
  }
  processElement(element) {
    if (!element)
      return "";
    if (typeof element === "string") {
      return element;
    }
    let result = "";
    for (const [tagName, content] of Object.entries(element)) {
      if (tagName.startsWith("@_") || tagName === "#text") {
        continue;
      }
      switch (tagName.toLowerCase()) {
        case "section":
          result += this.processSection(content);
          break;
        case "paragraph":
          result += this.processParagraph(content);
          break;
        case "run":
          result += this.processRun(content);
          break;
        case "span":
          result += this.processSpan(content);
          break;
        case "list":
          result += this.processList(content);
          break;
        case "table":
          result += this.processTable(content);
          break;
        case "hyperlink":
          result += this.processHyperlink(content);
          break;
        default:
          if (Array.isArray(content)) {
            for (const item of content) {
              result += this.processElement({ [tagName]: item });
            }
          } else {
            result += this.processElement(content);
          }
          break;
      }
    }
    return result;
  }
  processSection(section) {
    const sections = Array.isArray(section) ? section : [section];
    let result = "";
    for (const sect of sections) {
      if (!sect)
        continue;
      const borderThickness = sect["@_BorderThickness"] || "";
      const fontFamily = sect["@_FontFamily"] || "";
      const content = this.extractElementContent(sect);
      if (this.isHorizontalRule(borderThickness, content)) {
        result += `---

`;
        continue;
      }
      if (this.isBlockQuote(borderThickness)) {
        const quotedLines = content.split(`
`).map((line) => line.trim() ? "> " + line : ">").join(`
`);
        result += quotedLines + `

`;
        continue;
      }
      if (this.isMonospaceFont(fontFamily)) {
        const language = sect["@_Tag"] || "";
        result += "```" + language + `
` + content + "\n```\n\n";
        continue;
      }
      result += content + `

`;
    }
    return result;
  }
  processParagraph(paragraph) {
    const paragraphs = Array.isArray(paragraph) ? paragraph : [paragraph];
    let result = "";
    for (const para of paragraphs) {
      if (!para)
        continue;
      const fontSize = para["@_FontSize"] ? parseFloat(para["@_FontSize"]) : null;
      const content = this.extractElementContent(para);
      if (!content.trim()) {
        result += `
`;
        continue;
      }
      const headingLevel = this.getHeadingLevel(fontSize);
      if (headingLevel > 0) {
        result += "#".repeat(headingLevel) + " " + content.trim() + `

`;
      } else {
        result += content.trim() + `

`;
      }
    }
    return result;
  }
  processRun(run) {
    const runs = Array.isArray(run) ? run : [run];
    let result = "";
    for (const r of runs) {
      if (!r)
        continue;
      let text = r["@_Text"] || r["#text"] || "";
      if (!text)
        continue;
      text = this.applyInlineFormatting(text, r);
      result += text;
    }
    return result;
  }
  processSpan(span) {
    const spans = Array.isArray(span) ? span : [span];
    let result = "";
    for (const s of spans) {
      if (!s)
        continue;
      const content = this.extractElementContent(s);
      const formatted = this.applyInlineFormatting(content, s);
      result += formatted;
    }
    return result;
  }
  processList(list) {
    const lists = Array.isArray(list) ? list : [list];
    let result = "";
    for (const l of lists) {
      if (!l)
        continue;
      const markerStyle = l["@_MarkerStyle"] || "Disc";
      const isOrdered = markerStyle.toLowerCase().includes("decimal");
      result += this.processListItems(l, isOrdered) + `
`;
    }
    return result;
  }
  processListItems(list, isOrdered) {
    let result = "";
    let counter = 1;
    const listItems = this.extractListItems(list);
    for (const item of listItems) {
      const content = this.extractElementContent(item).trim();
      if (content) {
        const marker = isOrdered ? `${counter}. ` : "- ";
        result += marker + content + `
`;
        counter++;
      }
    }
    return result;
  }
  processTable(table) {
    const tables = Array.isArray(table) ? table : [table];
    let result = "";
    for (const t of tables) {
      if (!t)
        continue;
      const rows = this.extractTableRows(t);
      if (rows.length === 0)
        continue;
      if (rows.length > 0) {
        const headerCells = this.extractTableCells(rows[0]);
        const headerRow = "| " + headerCells.join(" | ") + " |";
        const separatorRow = "| " + headerCells.map(() => "---").join(" | ") + " |";
        result += headerRow + `
` + separatorRow + `
`;
        for (let i = 1;i < rows.length; i++) {
          const cells = this.extractTableCells(rows[i]);
          const dataRow = "| " + cells.join(" | ") + " |";
          result += dataRow + `
`;
        }
      }
      result += `
`;
    }
    return result;
  }
  processHyperlink(hyperlink) {
    const hyperlinks = Array.isArray(hyperlink) ? hyperlink : [hyperlink];
    let result = "";
    for (const link of hyperlinks) {
      if (!link)
        continue;
      const text = this.extractElementContent(link);
      const url = link["@_NavigateUri"] || "";
      if (url) {
        result += `[${text}](${url})`;
      } else {
        result += text;
      }
    }
    return result;
  }
  applyInlineFormatting(text, element) {
    if (!text)
      return "";
    let formatted = this.unicodeCleaner.cleanXamlText(text);
    const fontFamily = element["@_FontFamily"] || "";
    if (this.isMonospaceFont(fontFamily)) {
      formatted = "`" + formatted + "`";
    } else {
      const fontWeight = element["@_FontWeight"] || "";
      if (fontWeight.toLowerCase().includes("bold")) {
        formatted = "**" + formatted + "**";
      }
      const fontStyle = element["@_FontStyle"] || "";
      if (fontStyle.toLowerCase().includes("italic")) {
        formatted = "*" + formatted + "*";
      }
    }
    return formatted;
  }
  extractElementContent(element) {
    if (!element)
      return "";
    let content = "";
    if (element["#text"]) {
      content += this.unicodeCleaner.cleanXamlText(element["#text"]);
    }
    if (element["@_Text"]) {
      content += this.unicodeCleaner.cleanXamlText(element["@_Text"]);
    }
    for (const [key, value] of Object.entries(element)) {
      if (key.startsWith("@_") || key === "#text")
        continue;
      switch (key.toLowerCase()) {
        case "run":
          content += this.processRun(value);
          break;
        case "span":
          content += this.processSpan(value);
          break;
        case "hyperlink":
          content += this.processHyperlink(value);
          break;
        default:
          if (typeof value === "object" && value) {
            content += this.extractElementContent(value);
          }
          break;
      }
    }
    return content;
  }
  getHeadingLevel(fontSize) {
    if (fontSize === null)
      return 0;
    const index = this.options.headingSizes.indexOf(fontSize);
    return index >= 0 ? index + 1 : 0;
  }
  isHorizontalRule(borderThickness, content) {
    if (!borderThickness || content.trim())
      return false;
    const parts = borderThickness.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length !== 4)
      return false;
    return parts[1] === this.options.horizontalLineThickness && parts[0] === 0 && parts[2] === 0 && parts[3] === 0;
  }
  isBlockQuote(borderThickness) {
    if (!borderThickness)
      return false;
    const parts = borderThickness.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length !== 4)
      return false;
    return parts[0] === this.options.blockQuoteLineThickness && parts[1] === 0 && parts[2] === 0 && parts[3] === 0;
  }
  isMonospaceFont(fontFamily) {
    if (!fontFamily)
      return false;
    return fontFamily.toLowerCase().includes(this.options.monospaceFontName.toLowerCase());
  }
  extractListItems(list) {
    const items = [];
    for (const [key, value] of Object.entries(list)) {
      if (key.toLowerCase() === "listitem") {
        if (Array.isArray(value)) {
          items.push(...value);
        } else {
          items.push(value);
        }
      }
    }
    return items;
  }
  extractTableRows(table) {
    const rows = [];
    for (const [key, value] of Object.entries(table)) {
      if (key.toLowerCase() === "tablerowgroup") {
        const rowGroups = Array.isArray(value) ? value : [value];
        for (const rowGroup of rowGroups) {
          if (rowGroup) {
            for (const [rKey, rValue] of Object.entries(rowGroup)) {
              if (rKey.toLowerCase() === "tablerow") {
                if (Array.isArray(rValue)) {
                  rows.push(...rValue);
                } else {
                  rows.push(rValue);
                }
              }
            }
          }
        }
      } else if (key.toLowerCase() === "tablerow") {
        if (Array.isArray(value)) {
          rows.push(...value);
        } else {
          rows.push(value);
        }
      }
    }
    return rows;
  }
  extractTableCells(row) {
    const cells = [];
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase() === "tablecell") {
        const cellArray = Array.isArray(value) ? value : [value];
        for (const cell of cellArray) {
          if (this.isXamlElement(cell)) {
            const content = this.extractElementContent(cell).trim();
            cells.push(content || "");
          }
        }
      }
    }
    return cells;
  }
  extractPlainText(xamlContent) {
    const textMatches = xamlContent.match(/Text="([^"]*?)"/g) || [];
    const plainTexts = textMatches.map((match) => this.unicodeCleaner.cleanXamlText(match.replace(/Text="([^"]*?)"/, "$1")));
    const contentMatches = xamlContent.match(/>([^<]+)</g) || [];
    const contents = contentMatches.map((match) => this.unicodeCleaner.cleanXamlText(match.replace(/^>([^<]+)<$/, "$1").trim())).filter((text) => text && !text.startsWith("<?") && !text.startsWith("<!--"));
    return [...plainTexts, ...contents].join(" ").trim();
  }
  normalizeMarkdown(markdown) {
    return markdown.replace(/\n{3,}/g, `

`).replace(/^\s+|\s+$/g, "").replace(/\s+$/gm, "");
  }
}

// src/markdown-converter.ts
var DEFAULT_MARKDOWN_OPTIONS = {
  includeFrontmatter: true,
  includeMetadata: true,
  includeDates: true,
  includeReferences: true,
  includeKind: true,
  includeNotebook: true,
  customFields: {},
  dateFormat: "iso",
  includeId: false
};

class MarkdownConverter {
  options;
  xamlConverter;
  constructor(options = {}) {
    this.options = { ...DEFAULT_MARKDOWN_OPTIONS, ...options };
    this.xamlConverter = new XamlToMarkdownConverter;
  }
  convertNote(note, group, fileInfo) {
    const frontmatter = this.generateFrontmatter(note, group, fileInfo);
    const body = this.generateBody(note, group);
    let content = "";
    if (this.options.includeFrontmatter && Object.keys(frontmatter).length > 0) {
      content += this.serializeFrontmatter(frontmatter);
      content += `
---

`;
    }
    content += body;
    return {
      content,
      frontmatter,
      body,
      wordCount: this.countWords(body),
      characterCount: body.length
    };
  }
  generateFrontmatter(note, group, fileInfo) {
    const frontmatter = {};
    frontmatter.title = note.formattedTitle || this.generateTitleFromReferences(note) || "Untitled Note";
    if (this.options.includeDates) {
      frontmatter.created = this.formatDate(note.createdDate);
      if (note.modifiedDate) {
        frontmatter.modified = this.formatDate(note.modifiedDate);
      }
    }
    if (this.options.includeKind) {
      frontmatter.type = this.getNoteTypeName(note.kind);
    }
    if (this.options.includeId) {
      frontmatter.id = note.id;
    }
    if (this.options.includeNotebook && group.notebook) {
      frontmatter.notebook = {
        title: group.notebook.title,
        id: group.notebook.externalId,
        created: this.formatDate(group.notebook.createdDate)
      };
    }
    if (this.options.includeReferences && note.references.length > 0) {
      frontmatter.references = note.references.map((ref) => ({
        text: ref.formatted,
        book: ref.bookName,
        chapter: ref.chapter,
        verse: ref.verse
      }));
    }
    frontmatter.hasContent = !!(note.contentRichText && note.contentRichText.trim());
    const tags = this.extractTags(note);
    if (tags.length > 0) {
      frontmatter.tags = tags;
    }
    frontmatter.filename = fileInfo.filename;
    frontmatter.path = fileInfo.relativePath;
    Object.assign(frontmatter, this.options.customFields);
    return frontmatter;
  }
  generateBody(note, group) {
    const sections = [];
    if (!this.options.includeFrontmatter) {
      const title = note.formattedTitle || this.generateTitleFromReferences(note) || "Untitled Note";
      sections.push(`# ${title}
`);
    }
    if (this.options.includeMetadata && !this.options.includeFrontmatter) {
      sections.push(this.generateMetadataSection(note, group));
    }
    if (this.options.includeReferences && note.references.length > 0 && !this.options.includeFrontmatter) {
      sections.push(this.generateReferencesSection(note));
    }
    if (note.contentRichText && note.contentRichText.trim()) {
      try {
        const convertedContent = this.xamlConverter.convertToMarkdown(note.contentRichText);
        if (convertedContent.trim()) {
          sections.push(convertedContent.trim());
        } else {
          sections.push("*[This note contains formatting that could not be converted.]*");
        }
      } catch (error) {
        const plainText = this.extractPlainTextFromXaml(note.contentRichText);
        if (plainText.trim()) {
          sections.push(plainText.trim());
        } else {
          sections.push("*[This note contains content that could not be processed.]*");
        }
      }
    } else {
      sections.push("*[This note appears to be empty or contains only formatting.]*");
    }
    if (note.kind === 1) {
      sections.push(`
---

*This is a highlighted passage.*`);
    }
    return sections.join(`

`);
  }
  generateMetadataSection(note, group) {
    const lines = [`## Metadata
`];
    lines.push(`**Type:** ${this.getNoteTypeName(note.kind)}  `);
    lines.push(`**Created:** ${this.formatDate(note.createdDate)}  `);
    if (note.modifiedDate) {
      lines.push(`**Modified:** ${this.formatDate(note.modifiedDate)}  `);
    }
    if (group.notebook) {
      lines.push(`**Notebook:** ${group.notebook.title || "Untitled"}  `);
    }
    if (this.options.includeId) {
      lines.push(`**ID:** ${note.id}  `);
    }
    return lines.join(`
`);
  }
  generateReferencesSection(note) {
    const lines = [`## References
`];
    for (const ref of note.references) {
      lines.push(`- ${ref.formatted}`);
    }
    return lines.join(`
`);
  }
  serializeFrontmatter(frontmatter) {
    const lines = ["---"];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (value === null || value === undefined) {
        continue;
      }
      lines.push(this.serializeYamlValue(key, value, 0));
    }
    return lines.join(`
`);
  }
  serializeYamlValue(key, value, indent = 0) {
    const prefix = "  ".repeat(indent);
    if (value === null || value === undefined) {
      return `${prefix}${key}: null`;
    }
    if (typeof value === "string") {
      if (value.includes(`
`) || value.includes('"') || value.includes("'")) {
        const escapedValue = value.replace(/"/g, "\\\"");
        return `${prefix}${key}: "${escapedValue}"`;
      }
      return `${prefix}${key}: "${value}"`;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return `${prefix}${key}: ${value}`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${prefix}${key}: []`;
      }
      const lines = [`${prefix}${key}:`];
      for (const item of value) {
        if (typeof item === "object" && item !== null) {
          lines.push(`${prefix}  -`);
          for (const [subKey, subValue] of Object.entries(item)) {
            lines.push(this.serializeYamlValue(subKey, subValue, indent + 2));
          }
        } else {
          lines.push(`${prefix}  - ${this.formatYamlScalar(item)}`);
        }
      }
      return lines.join(`
`);
    }
    if (typeof value === "object") {
      const lines = [`${prefix}${key}:`];
      for (const [subKey, subValue] of Object.entries(value)) {
        lines.push(this.serializeYamlValue(subKey, subValue, indent + 1));
      }
      return lines.join(`
`);
    }
    return `${prefix}${key}: ${String(value)}`;
  }
  formatYamlScalar(value) {
    if (typeof value === "string") {
      if (value.includes('"') || value.includes("'") || value.includes(`
`)) {
        return `"${value.replace(/"/g, "\\\"")}"`;
      }
      return `"${value}"`;
    }
    return String(value);
  }
  getNoteTypeName(kind) {
    switch (kind) {
      case 0:
        return "note";
      case 1:
        return "highlight";
      case 2:
        return "annotation";
      default:
        return "unknown";
    }
  }
  formatDate(dateStr) {
    const date = new Date(dateStr);
    switch (this.options.dateFormat) {
      case "locale":
        return date.toLocaleDateString();
      case "short":
        return date.toISOString().split("T")[0];
      case "iso":
      default:
        return date.toISOString();
    }
  }
  generateTitleFromReferences(note) {
    if (note.references.length === 0)
      return null;
    const firstRef = note.references[0];
    if (firstRef && firstRef.formatted) {
      return String(firstRef.formatted);
    }
    return null;
  }
  extractPlainTextFromXaml(xaml) {
    if (!xaml)
      return "";
    const textMatches = xaml.match(/Text="([^"]*?)"/g) || [];
    const texts = textMatches.map((match) => cleanXamlText(match.replace(/Text="([^"]*?)"/, "$1").trim())).filter((text) => text);
    return texts.join(" ");
  }
  extractTags(note) {
    const tags = [];
    switch (note.kind) {
      case 0:
        tags.push("note");
        break;
      case 1:
        tags.push("highlight");
        break;
      case 2:
        tags.push("annotation");
        break;
      default:
        tags.push("note");
    }
    if (note.references.length > 0) {
      tags.push("scripture");
      const books = [...new Set(note.references.map((ref) => ref.bookName))];
      for (const book of books.slice(0, 3)) {
        if (book) {
          tags.push(book.toLowerCase().replace(/\s+/g, "-"));
        }
      }
    }
    return tags;
  }
  countWords(text) {
    if (!text || text.trim().length === 0)
      return 0;
    const plainText = text.replace(/[#*_`~]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    if (plainText.length === 0)
      return 0;
    return plainText.split(/\s+/).length;
  }
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  getOptions() {
    return { ...this.options };
  }
  convertNotebook(group, fileMap) {
    const results = new Map;
    for (const note of group.notes) {
      const fileInfo = fileMap.get(note);
      if (fileInfo) {
        const result = this.convertNote(note, group, fileInfo);
        results.set(note, result);
      }
    }
    return results;
  }
  getConversionStats(results) {
    let totalWords = 0;
    let totalCharacters = 0;
    let notesWithContent = 0;
    for (const result of results.values()) {
      totalWords += result.wordCount;
      totalCharacters += result.characterCount;
      if (result.wordCount > 0) {
        notesWithContent++;
      }
    }
    return {
      totalNotes: results.size,
      totalWords,
      totalCharacters,
      notesWithContent,
      averageWordCount: results.size > 0 ? Math.round(totalWords / results.size) : 0
    };
  }
}

// src/validator.ts
import { existsSync as existsSync2, statSync, readFileSync } from "fs";
import { join as join2 } from "path";
var DEFAULT_VALIDATION_OPTIONS = {
  checkNoteCount: true,
  checkXamlConversion: true,
  checkFileStructure: true,
  checkFrontmatter: true,
  checkReferences: true,
  sampleSize: 50
};

class ExportValidator {
  options;
  constructor(options = {}) {
    this.options = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  }
  async validateExport(exportDir, originalNotes, notebookGroups) {
    const issues = [];
    const stats = {
      filesChecked: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      issuesBySeverity: { error: 0, warning: 0, info: 0 },
      filesWithXaml: 0,
      filesWithConvertedContent: 0,
      averageFileSize: 0
    };
    if (!existsSync2(exportDir)) {
      issues.push({
        severity: "error",
        type: "structure",
        message: "Export directory does not exist",
        filePath: exportDir
      });
      return this.buildResult(false, issues, stats);
    }
    if (this.options.checkFileStructure) {
      this.validateFileStructure(exportDir, notebookGroups, issues, stats);
    }
    if (this.options.checkNoteCount) {
      await this.validateNoteCount(exportDir, originalNotes, issues, stats);
    }
    if (this.options.checkXamlConversion || this.options.checkFrontmatter || this.options.checkReferences) {
      await this.validateContent(exportDir, originalNotes, issues, stats);
    }
    stats.totalIssues = issues.length;
    stats.filesWithIssues = stats.filesChecked - (stats.filesChecked - issues.filter((i) => i.filePath).length);
    const isValid = stats.issuesBySeverity.error === 0;
    return this.buildResult(isValid, issues, stats);
  }
  validateFileStructure(exportDir, notebookGroups, issues, stats) {
    const mainReadme = join2(exportDir, "README.md");
    if (!existsSync2(mainReadme)) {
      issues.push({
        severity: "warning",
        type: "structure",
        message: "Main README.md not found",
        filePath: mainReadme
      });
    }
    for (const group of notebookGroups) {
      const notebookName = group.notebook?.title || "Orphaned Notes";
      const notebookDir = join2(exportDir, group.sanitizedFolderName);
      if (!existsSync2(notebookDir)) {
        issues.push({
          severity: "error",
          type: "structure",
          message: `Notebook directory missing: ${notebookName}`,
          filePath: notebookDir
        });
        continue;
      }
      const notebookReadme = join2(notebookDir, "README.md");
      if (!existsSync2(notebookReadme)) {
        issues.push({
          severity: "warning",
          type: "structure",
          message: `Notebook README missing: ${notebookName}`,
          filePath: notebookReadme
        });
      }
    }
    stats.issuesBySeverity.error = (stats.issuesBySeverity.error || 0) + issues.filter((i) => i.severity === "error").length;
    stats.issuesBySeverity.warning = (stats.issuesBySeverity.warning || 0) + issues.filter((i) => i.severity === "warning").length;
  }
  async validateNoteCount(exportDir, originalNotes, issues, stats) {
    const markdownFiles = this.findMarkdownFiles(exportDir);
    const expectedCount = originalNotes.length;
    const actualCount = markdownFiles.filter((f) => !f.endsWith("README.md")).length;
    if (actualCount !== expectedCount) {
      issues.push({
        severity: "error",
        type: "file",
        message: `Note count mismatch: expected ${expectedCount}, found ${actualCount}`,
        details: `Missing ${expectedCount - actualCount} notes`
      });
    } else {
      issues.push({
        severity: "info",
        type: "file",
        message: `All ${expectedCount} notes successfully exported`
      });
    }
    stats.filesChecked = actualCount;
    stats.issuesBySeverity.error = (stats.issuesBySeverity.error || 0) + issues.filter((i) => i.severity === "error").length;
    stats.issuesBySeverity.info = (stats.issuesBySeverity.info || 0) + issues.filter((i) => i.severity === "info").length;
  }
  async validateContent(exportDir, originalNotes, issues, stats) {
    const markdownFiles = this.findMarkdownFiles(exportDir).filter((f) => !f.endsWith("README.md"));
    const sampleFiles = this.options.sampleSize > 0 ? markdownFiles.slice(0, this.options.sampleSize) : markdownFiles;
    let totalSize = 0;
    for (const filePath of sampleFiles) {
      try {
        const content = readFileSync(filePath, "utf8");
        const fileSize = statSync(filePath).size;
        totalSize += fileSize;
        if (this.options.checkXamlConversion) {
          this.validateXamlConversion(filePath, content, issues, stats);
        }
        if (this.options.checkFrontmatter) {
          this.validateFrontmatter(filePath, content, issues);
        }
        if (this.options.checkReferences) {
          this.validateReferences(filePath, content, issues);
        }
      } catch (error) {
        issues.push({
          severity: "error",
          type: "file",
          message: `Failed to read file: ${error}`,
          filePath
        });
      }
    }
    stats.averageFileSize = sampleFiles.length > 0 ? Math.round(totalSize / sampleFiles.length) : 0;
    stats.issuesBySeverity.error = (stats.issuesBySeverity.error || 0) + issues.filter((i) => i.severity === "error").length;
    stats.issuesBySeverity.warning = (stats.issuesBySeverity.warning || 0) + issues.filter((i) => i.severity === "warning").length;
  }
  validateXamlConversion(filePath, content, issues, stats) {
    const xamlPatterns = [
      /<Paragraph[^>]*>/i,
      /<Run[^>]*>/i,
      /<Span[^>]*>/i,
      /Text="[^"]*"/i,
      /FontSize="[^"]*"/i
    ];
    let hasXaml = false;
    for (const pattern of xamlPatterns) {
      if (pattern.test(content)) {
        hasXaml = true;
        break;
      }
    }
    if (hasXaml) {
      stats.filesWithXaml++;
      issues.push({
        severity: "error",
        type: "content",
        message: "File contains unconverted XAML content",
        filePath,
        details: "XAML-to-Markdown conversion may have failed"
      });
    } else {
      stats.filesWithConvertedContent++;
    }
    const markdownPatterns = [
      /^#+ /m,
      /\*\*[^*]+\*\*/,
      /\*[^*]+\*/,
      /\[.+\]\(.+\)/,
      /^- /m,
      /^> /m
    ];
    const hasMarkdown = markdownPatterns.some((pattern) => pattern.test(content));
    if (!hasXaml && !hasMarkdown && content.length > 100) {
      issues.push({
        severity: "warning",
        type: "content",
        message: "File lacks typical markdown formatting",
        filePath,
        details: "Content may be plain text only"
      });
    }
  }
  validateFrontmatter(filePath, content, issues) {
    if (!content.startsWith(`---
`)) {
      issues.push({
        severity: "warning",
        type: "format",
        message: "Missing YAML frontmatter",
        filePath
      });
      return;
    }
    const frontmatterEnd = content.indexOf(`
---
`, 4);
    if (frontmatterEnd === -1) {
      issues.push({
        severity: "error",
        type: "format",
        message: "Malformed YAML frontmatter (missing end marker)",
        filePath
      });
      return;
    }
    const frontmatter = content.substring(4, frontmatterEnd);
    const requiredFields = ["title", "created", "type"];
    for (const field of requiredFields) {
      if (!frontmatter.includes(`${field}:`)) {
        issues.push({
          severity: "warning",
          type: "format",
          message: `Missing required frontmatter field: ${field}`,
          filePath
        });
      }
    }
  }
  validateReferences(filePath, content, issues) {
    if (content.includes("references:")) {
      const referenceMatches = content.match(/- reference: "([^"]+)"/g);
      if (referenceMatches) {
        for (const match of referenceMatches) {
          const reference = match.match(/- reference: "([^"]+)"/)?.[1];
          if (reference && !this.isValidReference(reference)) {
            issues.push({
              severity: "warning",
              type: "content",
              message: `Potentially invalid Bible reference: ${reference}`,
              filePath
            });
          }
        }
      }
    }
  }
  findMarkdownFiles(dir) {
    const files = [];
    try {
      const { readdirSync, statSync: statSync2 } = __require("fs");
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join2(dir, entry);
        const stat = statSync2(fullPath);
        if (stat.isDirectory()) {
          files.push(...this.findMarkdownFiles(fullPath));
        } else if (entry.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch (error) {}
    return files;
  }
  isValidReference(reference) {
    const patterns = [
      /^[A-Za-z0-9\s]+ \d+:\d+/,
      /^[A-Za-z0-9\s]+ \d+:\d+-\d+/,
      /^[A-Za-z0-9\s]+ \d+/
    ];
    return patterns.some((pattern) => pattern.test(reference));
  }
  sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  }
  buildResult(isValid, issues, stats) {
    const errorCount = stats.issuesBySeverity.error || 0;
    const warningCount = stats.issuesBySeverity.warning || 0;
    const infoCount = stats.issuesBySeverity.info || 0;
    let summary = `Validation ${isValid ? "PASSED" : "FAILED"}`;
    summary += ` - ${stats.filesChecked} files checked`;
    if (errorCount > 0) {
      summary += `, ${errorCount} errors`;
    }
    if (warningCount > 0) {
      summary += `, ${warningCount} warnings`;
    }
    if (infoCount > 0) {
      summary += `, ${infoCount} info`;
    }
    if (this.options.checkXamlConversion) {
      summary += ` - XAML conversion: ${stats.filesWithConvertedContent}/${stats.filesChecked} files converted successfully`;
    }
    return {
      isValid,
      issues,
      stats,
      summary
    };
  }
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  getOptions() {
    return { ...this.options };
  }
}

// src/notestool-database.ts
import { Database } from "bun:sqlite";

// src/database-locator.ts
import { existsSync as existsSync3, readdirSync, statSync as statSync2 } from "fs";
import { join as join3, resolve } from "path";
import { homedir } from "os";

class DatabaseLocator {
  static DATABASE_FILENAME = "notestool.db";
  static SUBDIRECTORY = "NotesToolManager";
  static findDatabases() {
    const locations = [];
    const devPath = join3("LogosDocuments", this.SUBDIRECTORY, this.DATABASE_FILENAME);
    locations.push(this.createLocation(devPath, "development", "Development location (current working directory)"));
    const platform = process.platform;
    if (platform === "win32") {
      locations.push(...this.findWindowsLocations());
    } else if (platform === "darwin") {
      locations.push(...this.findMacOSLocations());
    }
    return locations.sort((a, b) => {
      if (a.exists && !b.exists)
        return -1;
      if (!a.exists && b.exists)
        return 1;
      if (a.exists && b.exists) {
        return (b.size || 0) - (a.size || 0);
      }
      return 0;
    });
  }
  static getBestDatabase() {
    const locations = this.findDatabases();
    return locations.find((loc) => loc.exists) || null;
  }
  static checkCustomPath(customPath) {
    if (!customPath)
      return null;
    let fullPath = customPath;
    if (existsSync3(customPath) && statSync2(customPath).isDirectory()) {
      fullPath = join3(customPath, this.DATABASE_FILENAME);
    }
    return this.createLocation(fullPath, "custom", `Custom path: ${customPath}`);
  }
  static findWindowsLocations() {
    const locations = [];
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData)
      return locations;
    const logosPath = join3(localAppData, "Logos4", "Documents");
    return this.searchRandomIdDirectories(logosPath, "windows", "Windows Logos installation");
  }
  static findMacOSLocations() {
    const locations = [];
    const logosPath = join3(homedir(), "Library", "Application Support", "Logos4", "Documents");
    return this.searchRandomIdDirectories(logosPath, "macos", "macOS Logos installation");
  }
  static searchRandomIdDirectories(basePath, type, description) {
    const locations = [];
    if (!existsSync3(basePath))
      return locations;
    try {
      const entries = readdirSync(basePath);
      for (const entry of entries) {
        const entryPath = join3(basePath, entry);
        if (statSync2(entryPath).isDirectory()) {
          const dbPath = join3(entryPath, this.SUBDIRECTORY, this.DATABASE_FILENAME);
          if (existsSync3(dbPath)) {
            locations.push(this.createLocation(dbPath, type, `${description} (${entry})`));
          }
        }
      }
    } catch (error) {}
    return locations;
  }
  static createLocation(path, type, description) {
    const fullPath = resolve(path);
    const exists = existsSync3(fullPath);
    let size;
    let lastModified;
    if (exists) {
      try {
        const stats = statSync2(fullPath);
        size = stats.size;
        lastModified = stats.mtime;
      } catch (error) {}
    }
    return {
      path: fullPath,
      type,
      description,
      exists,
      size,
      lastModified
    };
  }
  static validateDatabase(path) {
    if (!existsSync3(path)) {
      return { valid: false, error: "Database file does not exist" };
    }
    try {
      const stats = statSync2(path);
      if (stats.size === 0) {
        return { valid: false, error: "Database file is empty" };
      }
      if (stats.size < 1024) {
        return { valid: false, error: "Database file is too small (likely corrupted)" };
      }
      const fs = __require("fs");
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(path, "r");
      try {
        fs.readSync(fd, buffer, 0, 16, 0);
        const signature = buffer.toString("ascii", 0, 15);
        if (!signature.startsWith("SQLite format 3")) {
          return { valid: false, error: "File does not appear to be a valid SQLite database" };
        }
      } finally {
        fs.closeSync(fd);
      }
      return {
        valid: true,
        info: `Valid SQLite database (${(stats.size / 1024 / 1024).toFixed(1)} MB, modified ${stats.mtime.toISOString()})`
      };
    } catch (error) {
      return { valid: false, error: `Failed to validate database: ${error}` };
    }
  }
  static displayLocations() {
    const locations = this.findDatabases();
    const lines = [];
    lines.push(`\uD83D\uDD0D Searching for Logos NotesTool databases...
`);
    if (locations.length === 0) {
      lines.push("\u274C No database locations found");
      return lines;
    }
    for (const [index, location] of locations.entries()) {
      const status = location.exists ? "\u2705" : "\u274C";
      const sizeInfo = location.size ? ` (${(location.size / 1024 / 1024).toFixed(1)} MB)` : "";
      const dateInfo = location.lastModified ? ` - ${location.lastModified.toLocaleDateString()}` : "";
      lines.push(`${status} [${index + 1}] ${location.description}`);
      lines.push(`    ${location.path}${sizeInfo}${dateInfo}`);
      if (location.exists && index === 0) {
        lines.push("    \uD83D\uDC46 This database will be used by default");
      }
      lines.push("");
    }
    return lines;
  }
  static getSearchInstructions() {
    const platform = process.platform;
    const lines = [];
    lines.push(`\uD83D\uDCCB Manual Database Location Instructions:
`);
    if (platform === "win32") {
      lines.push("Windows:");
      lines.push("1. Open File Explorer");
      lines.push("2. Navigate to: %LOCALAPPDATA%\\Logos4\\Documents");
      lines.push('3. Look for a directory with a random ID (e.g., "abc123def456...")');
      lines.push("4. Inside that directory, look for: NotesToolManager\\notestool.db");
      lines.push("");
      lines.push("Example path:");
      lines.push("C:\\Users\\YourName\\AppData\\Local\\Logos4\\Documents\\{random-id}\\NotesToolManager\\notestool.db");
    } else if (platform === "darwin") {
      lines.push("macOS:");
      lines.push("1. Open Finder");
      lines.push("2. Press Cmd+Shift+G (Go to Folder)");
      lines.push("3. Navigate to: ~/Library/Application Support/Logos4/Documents");
      lines.push("4. Look for a directory with a random ID");
      lines.push("5. Inside that directory, look for: NotesToolManager/notestool.db");
      lines.push("");
      lines.push("Example path:");
      lines.push("/Users/YourName/Library/Application Support/Logos4/Documents/{random-id}/NotesToolManager/notestool.db");
    } else {
      lines.push("Linux/Other:");
      lines.push("Database location varies by Logos installation method.");
      lines.push("Check your Logos installation documentation.");
    }
    lines.push("");
    lines.push("\uD83D\uDCA1 Tip: Use the --database flag to specify a custom path:");
    lines.push('   bun run export --database "/path/to/your/notestool.db"');
    return lines;
  }
}

// src/notestool-database.ts
class NotesToolDatabase {
  db;
  dbLocation;
  constructor(dbPath) {
    this.dbLocation = this.findDatabase(dbPath);
    const validation = DatabaseLocator.validateDatabase(this.dbLocation.path);
    if (!validation.valid) {
      throw new Error(`Invalid database: ${validation.error}`);
    }
    this.db = new Database(this.dbLocation.path, { readonly: true });
  }
  findDatabase(customPath) {
    if (customPath) {
      const customLocation = DatabaseLocator.checkCustomPath(customPath);
      if (!customLocation) {
        throw new Error(`Invalid custom database path: ${customPath}`);
      }
      if (!customLocation.exists) {
        throw new Error(`Database file not found at custom path: ${customPath}`);
      }
      return customLocation;
    }
    const bestLocation = DatabaseLocator.getBestDatabase();
    if (!bestLocation) {
      const locations = DatabaseLocator.displayLocations();
      const instructions = DatabaseLocator.getSearchInstructions();
      throw new Error(`No Logos NotesTool database found in standard locations.

` + locations.join(`
`) + `

` + instructions.join(`
`));
    }
    return bestLocation;
  }
  getDatabaseInfo() {
    return { ...this.dbLocation };
  }
  static displayAvailableLocations() {
    return DatabaseLocator.displayLocations();
  }
  static getSearchInstructions() {
    return DatabaseLocator.getSearchInstructions();
  }
  getActiveNotes() {
    const query = `
      SELECT 
        NoteId as id,
        ExternalId as externalId,
        CreatedDate as createdDate,
        ModifiedDate as modifiedDate,
        Kind as kind,
        ContentRichText as contentRichText,
        AnchorBibleBook as anchorBibleBook,
        NotebookExternalId as notebookExternalId,
        NoteStyleId as noteStyleId,
        NoteColorId as noteColorId,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notes
      WHERE IsDeleted = 0 AND IsTrashed = 0
      ORDER BY CreatedDate, NoteId
    `;
    return this.db.query(query).all();
  }
  getBibleReferences(noteIds) {
    let query = `
      SELECT 
        NoteId as noteId,
        Reference as reference,
        BibleBook as bibleBook,
        AnchorIndex as anchorIndex,
        DataTypeId as dataTypeId
      FROM NoteAnchorFacetReferences
    `;
    if (noteIds && noteIds.length > 0) {
      const placeholders = noteIds.map(() => "?").join(",");
      query += ` WHERE NoteId IN (${placeholders})`;
      return this.db.query(query).all(...noteIds);
    }
    query += ` ORDER BY NoteId, AnchorIndex`;
    return this.db.query(query).all();
  }
  getActiveNotebooks() {
    const query = `
      SELECT 
        NotebookId as notebookId,
        ExternalId as externalId,
        Title as title,
        CreatedDate as createdDate,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notebooks
      WHERE IsDeleted = 0 AND IsTrashed = 0
      ORDER BY Title
    `;
    return this.db.query(query).all();
  }
  getNotebook(externalId) {
    const query = `
      SELECT 
        NotebookId as notebookId,
        ExternalId as externalId,
        Title as title,
        CreatedDate as createdDate,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notebooks
      WHERE ExternalId = ? AND IsDeleted = 0 AND IsTrashed = 0
    `;
    return this.db.query(query).get(externalId);
  }
  getNoteStyles() {
    const query = `
      SELECT 
        NoteStyleId as noteStyleId,
        Name as name
      FROM NoteStyles
      ORDER BY NoteStyleId
    `;
    return this.db.query(query).all();
  }
  getNoteColors() {
    const query = `
      SELECT 
        NoteColorId as noteColorId,
        Name as name
      FROM NoteColors
      ORDER BY NoteColorId
    `;
    return this.db.query(query).all();
  }
  getDataTypes() {
    const query = `
      SELECT 
        DataTypeId as dataTypeId,
        Name as name
      FROM DataTypes
      ORDER BY DataTypeId
    `;
    return this.db.query(query).all();
  }
  getNotesWithReferences() {
    const notes = this.getActiveNotes();
    const noteIds = notes.map((n) => n.id);
    const references = this.getBibleReferences(noteIds);
    const notebooks = this.getActiveNotebooks();
    const styles = this.getNoteStyles();
    const colors = this.getNoteColors();
    const notebookMap = new Map(notebooks.map((nb) => [nb.externalId, nb]));
    const styleMap = new Map(styles.map((s) => [s.noteStyleId, s]));
    const colorMap = new Map(colors.map((c) => [c.noteColorId, c]));
    const referencesMap = new Map;
    for (const ref of references) {
      if (!referencesMap.has(ref.noteId)) {
        referencesMap.set(ref.noteId, []);
      }
      referencesMap.get(ref.noteId).push(ref);
    }
    return notes.map((note) => ({
      ...note,
      references: referencesMap.get(note.id) || [],
      notebook: notebookMap.get(note.notebookExternalId),
      style: note.noteStyleId ? styleMap.get(note.noteStyleId) : undefined,
      color: note.noteColorId ? colorMap.get(note.noteColorId) : undefined
    }));
  }
  getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as totalNotes,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 THEN 1 ELSE 0 END) as activeNotes,
        SUM(CASE WHEN IsDeleted = 1 THEN 1 ELSE 0 END) as deletedNotes,
        SUM(CASE WHEN IsTrashed = 1 THEN 1 ELSE 0 END) as trashedNotes,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 AND ContentRichText IS NOT NULL AND ContentRichText != '' THEN 1 ELSE 0 END) as notesWithContent
      FROM Notes
    `;
    const refStatsQuery = `
      SELECT COUNT(DISTINCT NoteId) as notesWithReferences
      FROM NoteAnchorFacetReferences
    `;
    const notebookStatsQuery = `
      SELECT 
        COUNT(*) as totalNotebooks,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 THEN 1 ELSE 0 END) as activeNotebooks
      FROM Notebooks
    `;
    const noteStats = this.db.query(statsQuery).get();
    const refStats = this.db.query(refStatsQuery).get();
    const notebookStats = this.db.query(notebookStatsQuery).get();
    return {
      ...noteStats,
      ...refStats,
      ...notebookStats
    };
  }
  close() {
    this.db.close();
  }
}

// src/cli.ts
var HELP_TEXT = `
Logos Notes Exporter - Convert Logos notes to Markdown

USAGE:
  bun run cli.ts [OPTIONS]

OPTIONS:
  --database, -d        Path to NotesTool database file (auto-detected if not specified)
  --list-databases      List all available database locations and exit
  --show-instructions   Show manual database location instructions and exit
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
  --help, -h           Show this help
  --version            Show version

EXAMPLES:
  # Basic export (auto-finds database)
  bun run cli.ts
  
  # List available database locations
  bun run cli.ts --list-databases
  
  # Export with custom database
  bun run cli.ts --database ./path/to/notestool.db
  
  # Custom output with date folders
  bun run cli.ts -o ./my-notes --date-folders
  
  # Dry run to see what would be exported
  bun run cli.ts --dry-run --verbose
  
  # Export without frontmatter
  bun run cli.ts --no-frontmatter --metadata

NOTES:
  - Database is auto-detected in standard Logos installation locations
  - Windows: %LOCALAPPDATA%\\Logos4\\Documents\\{random-id}\\NotesToolManager\\notestool.db
  - macOS: ~/Library/Application Support/Logos4/Documents/{random-id}/NotesToolManager/notestool.db
  - Use --list-databases to see all available locations
  - All database operations are READ-ONLY for safety
  - Output files will be organized by notebooks unless --no-organize-notebooks
  - Existing files will be overwritten
`;

class LogosNotesExporter {
  database;
  organizer;
  fileOrganizer;
  markdownConverter;
  validator;
  options;
  constructor(options) {
    this.options = options;
    this.database = new NotesToolDatabase(options.database);
    this.organizer = new NotebookOrganizer(this.database);
    if (options.verbose) {
      const dbInfo = this.database.getDatabaseInfo();
      console.log(`\uD83D\uDCC1 Using database: ${dbInfo.description}`);
      console.log(`   Path: ${dbInfo.path}`);
      if (dbInfo.size) {
        console.log(`   Size: ${(dbInfo.size / 1024 / 1024).toFixed(1)} MB`);
      }
      console.log("");
    }
    const fileOptions = {
      baseDir: options.output || "./exported-notes",
      organizeByNotebooks: options.organizeByNotebooks !== false,
      includeDateFolders: options.includeDateFolders || false,
      createIndexFiles: options.createIndexFiles !== false
    };
    this.fileOrganizer = new FileOrganizer(fileOptions);
    const markdownOptions = {
      includeFrontmatter: options.includeFrontmatter !== false,
      includeMetadata: options.includeMetadata !== false,
      includeDates: options.includeDates !== false,
      includeReferences: options.includeReferences !== false,
      includeNotebook: options.includeNotebook !== false,
      includeId: options.includeId || false,
      dateFormat: options.dateFormat || "iso"
    };
    this.markdownConverter = new MarkdownConverter(markdownOptions);
    this.validator = new ExportValidator;
  }
  async export() {
    try {
      this.log(`Starting Logos Notes export...
`);
      this.log("\uD83D\uDCDA Organizing notes by notebooks...");
      const notebookGroups = await this.organizer.organizeNotes();
      this.log(`Found ${notebookGroups.length} notebook groups`);
      const stats = this.organizer.getOrganizationStats();
      this.logStats(stats);
      this.log(`
\uD83D\uDCC1 Planning file structure...`);
      const structure = await this.fileOrganizer.planDirectoryStructure(notebookGroups);
      const summary = this.fileOrganizer.getFileOperationSummary(notebookGroups);
      this.logFileSummary(summary);
      if (this.options.dryRun) {
        this.log(`
\uD83D\uDD0D DRY RUN - No files will be written`);
        this.logDryRunSummary(notebookGroups);
        return;
      }
      this.log(`
\uD83D\uDCDD Converting notes to markdown...`);
      let totalProcessed = 0;
      for (const group of notebookGroups) {
        const notebookName = group.notebook?.title || "Orphaned Notes";
        this.log(`
Processing: ${notebookName} (${group.notes.length} notes)`);
        const fileMap = this.fileOrganizer.resolveFilenameConflicts(group.notes, group);
        const markdownResults = this.markdownConverter.convertNotebook(group, fileMap);
        for (const [note, result] of markdownResults) {
          const fileInfo = fileMap.get(note);
          if (fileInfo) {
            await this.fileOrganizer.writeFile(fileInfo, result.content);
            totalProcessed++;
            if (this.options.verbose) {
              this.log(`  \u2713 ${fileInfo.filename}`);
            }
          }
        }
        if (this.fileOrganizer.getOptions().createIndexFiles) {
          const indexContent = this.fileOrganizer.generateNotebookIndex(group);
          const indexPath = join4(this.fileOrganizer.getNotebookDirectory(group), "README.md");
          await this.fileOrganizer.ensureDirectory(this.fileOrganizer.getNotebookDirectory(group));
          await this.fileOrganizer.writeFile({
            fullPath: indexPath,
            directory: this.fileOrganizer.getNotebookDirectory(group),
            filename: "README",
            relativePath: indexPath.replace(this.fileOrganizer.getOptions().baseDir + "/", ""),
            exists: false
          }, indexContent);
        }
      }
      if (this.fileOrganizer.getOptions().createIndexFiles) {
        this.log(`
\uD83D\uDCCB Creating main index...`);
        const mainIndexContent = this.fileOrganizer.generateMainIndex(notebookGroups, stats);
        const mainIndexPath = join4(this.fileOrganizer.getOptions().baseDir, "README.md");
        await this.fileOrganizer.writeFile({
          fullPath: mainIndexPath,
          directory: this.fileOrganizer.getOptions().baseDir,
          filename: "README",
          relativePath: "README.md",
          exists: false
        }, mainIndexContent);
      }
      if (!this.options.dryRun) {
        this.log(`
\uD83D\uDD0D Validating export...`);
        const allNotes = notebookGroups.flatMap((group) => group.notes);
        const validationResult = await this.validator.validateExport(this.fileOrganizer.getOptions().baseDir, allNotes, notebookGroups);
        this.displayValidationResults(validationResult);
        if (!validationResult.isValid) {
          this.log(`
\u26A0\uFE0F  Export completed with validation issues. See details above.`);
        }
      }
      this.log(`
\u2705 Export completed successfully!`);
      this.log(`\uD83D\uDCC1 Output directory: ${this.fileOrganizer.getOptions().baseDir}`);
      this.log(`\uD83D\uDCC4 Total files created: ${totalProcessed}`);
      this.log(`\uD83D\uDCDA Notebooks processed: ${notebookGroups.length}`);
    } catch (error) {
      console.error(`
\u274C Export failed:`, error);
      process.exit(1);
    } finally {
      this.organizer.close();
    }
  }
  log(message) {
    console.log(message);
  }
  logStats(stats) {
    this.log(`
\uD83D\uDCCA Statistics:`);
    this.log(`  Total Notes: ${stats.totalNotes}`);
    this.log(`  Notes with Content: ${stats.notesWithContent}`);
    this.log(`  Notes with References: ${stats.notesWithReferences}`);
    this.log(`  Notebooks: ${stats.notebooks}`);
    this.log(`  Orphaned Notes: ${stats.orphanedNotes}`);
  }
  logFileSummary(summary) {
    this.log(`  Directories to create: ${summary.totalDirectories}`);
    this.log(`  Notes to export: ${summary.totalFiles}`);
    this.log(`  Index files to create: ${summary.totalIndexFiles}`);
    this.log(`  Estimated size: ${summary.estimatedSize}`);
  }
  logDryRunSummary(notebookGroups) {
    for (const group of notebookGroups) {
      const notebookName = group.notebook?.title || "Orphaned Notes";
      this.log(`
\uD83D\uDCDA ${notebookName}:`);
      this.log(`  \uD83D\uDCC4 ${group.notes.length} notes would be exported`);
      if (this.options.verbose) {
        for (const note of group.notes.slice(0, 5)) {
          this.log(`    - ${note.formattedTitle || "Untitled"}`);
        }
        if (group.notes.length > 5) {
          this.log(`    ... and ${group.notes.length - 5} more`);
        }
      }
    }
  }
  displayValidationResults(result) {
    this.log(`
\uD83D\uDCCB ${result.summary}`);
    if (result.issues.length > 0) {
      const errors = result.issues.filter((i) => i.severity === "error");
      const warnings = result.issues.filter((i) => i.severity === "warning");
      if (errors.length > 0) {
        this.log(`
\u274C Errors found:`);
        for (const error of errors.slice(0, 5)) {
          this.log(`  \u2022 ${error.message}`);
          if (error.filePath && this.options.verbose) {
            this.log(`    File: ${error.filePath}`);
          }
        }
        if (errors.length > 5) {
          this.log(`  ... and ${errors.length - 5} more errors`);
        }
      }
      if (warnings.length > 0 && this.options.verbose) {
        this.log(`
\u26A0\uFE0F  Warnings found:`);
        for (const warning of warnings.slice(0, 3)) {
          this.log(`  \u2022 ${warning.message}`);
        }
        if (warnings.length > 3) {
          this.log(`  ... and ${warnings.length - 3} more warnings`);
        }
      }
    }
    if (result.stats.filesWithXaml > 0) {
      this.log(`
\uD83D\uDD34 XAML Conversion Issue: ${result.stats.filesWithXaml} files still contain XAML content`);
      this.log("   This indicates the XAML-to-Markdown conversion may not be working properly.");
    } else if (result.stats.filesWithConvertedContent > 0) {
      this.log(`
\u2705 XAML Conversion: ${result.stats.filesWithConvertedContent} files successfully converted`);
    }
  }
  getFileOrganizerOptions() {
    return this.fileOrganizer.getOptions();
  }
}
function parseCommandLine() {
  const args = process.argv.slice(2);
  const parsed = parseArgs({
    args,
    options: {
      database: { type: "string", short: "d" },
      "list-databases": { type: "boolean" },
      "show-instructions": { type: "boolean" },
      output: { type: "string", short: "o" },
      "organize-notebooks": { type: "boolean" },
      "date-folders": { type: "boolean" },
      "index-files": { type: "boolean" },
      frontmatter: { type: "boolean" },
      metadata: { type: "boolean" },
      dates: { type: "boolean" },
      references: { type: "boolean" },
      "notebook-info": { type: "boolean" },
      "include-id": { type: "boolean" },
      "date-format": { type: "string" },
      verbose: { type: "boolean", short: "v" },
      "dry-run": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean" }
    },
    allowPositionals: false
  });
  const options = {
    database: parsed.values.database,
    listDatabases: parsed.values["list-databases"],
    showInstructions: parsed.values["show-instructions"],
    output: parsed.values.output,
    organizeByNotebooks: parsed.values["organize-notebooks"],
    includeDateFolders: parsed.values["date-folders"],
    createIndexFiles: parsed.values["index-files"],
    includeFrontmatter: parsed.values.frontmatter,
    includeMetadata: parsed.values.metadata,
    includeDates: parsed.values.dates,
    includeReferences: parsed.values.references,
    includeNotebook: parsed.values["notebook-info"],
    includeId: parsed.values["include-id"],
    dateFormat: parsed.values["date-format"],
    verbose: parsed.values.verbose,
    dryRun: parsed.values["dry-run"],
    help: parsed.values.help,
    version: parsed.values.version
  };
  return options;
}
function validateOptions(options) {
  if (options.database && !existsSync4(options.database)) {
    console.error(`\u274C Database file not found: ${options.database}`);
    process.exit(1);
  }
  if (options.dateFormat && !["iso", "locale", "short"].includes(options.dateFormat)) {
    console.error(`\u274C Invalid date format: ${options.dateFormat}. Must be one of: iso, locale, short`);
    process.exit(1);
  }
}
async function main() {
  const options = parseCommandLine();
  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  if (options.version) {
    console.log("Logos Notes Exporter v1.0.0");
    process.exit(0);
  }
  if (options.listDatabases) {
    const locations = NotesToolDatabase.displayAvailableLocations();
    console.log(locations.join(`
`));
    process.exit(0);
  }
  if (options.showInstructions) {
    const instructions = NotesToolDatabase.getSearchInstructions();
    console.log(instructions.join(`
`));
    process.exit(0);
  }
  validateOptions(options);
  const exporter = new LogosNotesExporter(options);
  await exporter.export();
}
if (import.meta.main) {
  main().catch((error) => {
    console.error("\u274C Fatal error:", error);
    process.exit(1);
  });
}
export {
  validateOptions,
  parseCommandLine,
  main,
  LogosNotesExporter
};
