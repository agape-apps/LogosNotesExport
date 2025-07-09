export interface BibleBookMapping {
  anchorId: number;
  englishName: string;
  osisId: number;
  chapterCount: number;
  status: string;
  logosBibleId?: string;
}

export interface DecodedReference {
  bookName: string;
  chapter?: number;
  verse?: number;
  endChapter?: number;
  endVerse?: number;
  reference: string; // Original reference
  anchorBookId: number;
  formatted: string; // Human readable format
}

export class BibleReferenceDecoder {
  private bookMappings: Map<number, BibleBookMapping> = new Map();

  constructor() {
    this.initializeBookMappings();
  }

  /**
   * Decode a Logos Bible reference string into human-readable format
   * Example input: "bible+nkjv.61.24.14" (Anchor format)
   * Example output: "1 Peter 24:14" 
   */
  public decodeReference(reference: string, anchorBookId?: number): DecodedReference | null {
    try {
      // Handle different reference formats
      if (reference.includes('bible+')) {
        return this.decodeBiblePlusReference(reference, anchorBookId);
      } else if (reference.includes('.')) {
        return this.decodeDottedReference(reference, anchorBookId);
      } else {
        return this.decodeSimpleReference(reference, anchorBookId);
      }
    } catch (error) {
      console.warn(`Failed to decode reference: ${reference}`, error);
      return null;
    }
  }

  /**
   * Get book name from anchor book ID
   */
  public getBookName(anchorBookId: number): string {
    const mapping = this.bookMappings.get(anchorBookId);
    return mapping ? mapping.englishName : `Unknown Book ${anchorBookId}`;
  }

  /**
   * Decode Logos "bible+version.book.chapter.verse" format
   */
  private decodeBiblePlusReference(reference: string, anchorBookId?: number): DecodedReference | null {
    // Pattern: bible+nkjv.61.24.14 or bible+esv.1.1.1-1.1.31
    const match = reference.match(/bible\+([^.]+)\.(\d+)\.(\d+)\.(\d+)(?:-(\d+)\.(\d+)\.(\d+))?/);
    if (!match) return null;

    const [, version, bookNum, chapter, verse, endBook, endChapter, endVerse] = match;
    const bookId = parseInt(bookNum || '0');
    const bookName = this.getBookName(anchorBookId || bookId);

    const result: DecodedReference = {
      bookName,
      chapter: parseInt(chapter || '0'),
      verse: parseInt(verse || '0'),
      reference,
      anchorBookId: anchorBookId || bookId,
      formatted: this.formatReference(bookName, parseInt(chapter || '0'), parseInt(verse || '0'), 
        endChapter ? parseInt(endChapter || '0') : undefined, 
        endVerse ? parseInt(endVerse || '0') : undefined)
    };

    if (endChapter && endVerse) {
      result.endChapter = parseInt(endChapter || '0');
      result.endVerse = parseInt(endVerse || '0');
    }

    return result;
  }

  /**
   * Decode simple dotted reference format
   */
  private decodeDottedReference(reference: string, anchorBookId?: number): DecodedReference | null {
    // Pattern: 61.24.14 or 1.1.1-31
    const parts = reference.split('.');
    if (parts.length < 2) return null;

    const bookId = anchorBookId || parseInt(parts[0] || '0');
    const chapter = parseInt(parts[1] || '0');
    const verse = parts[2] ? parseInt(parts[2] || '0') : undefined;
    
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

  /**
   * Decode simple reference (fallback)
   */
  private decodeSimpleReference(reference: string, anchorBookId?: number): DecodedReference | null {
    if (!anchorBookId) return null;

    const bookName = this.getBookName(anchorBookId);
    
    return {
      bookName,
      reference,
      anchorBookId,
      formatted: `${bookName} (${reference})`
    };
  }

  /**
   * Format reference into human-readable string
   */
  private formatReference(bookName: string, chapter: number, verse?: number, 
                         endChapter?: number, endVerse?: number): string {
    let formatted = bookName;

    if (chapter) {
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

    return formatted;
  }

  /**
   * Initialize Bible book mappings from the anchor documentation
   * Based on docs/anchor-complete-ot-nt-mapping.md
   */
  private initializeBookMappings(): void {
    // Old Testament Books
    const otBooks: BibleBookMapping[] = [
      { anchorId: 1, englishName: 'Genesis', osisId: 1, chapterCount: 50, status: 'Complete' },
      { anchorId: 2, englishName: 'Exodus', osisId: 2, chapterCount: 40, status: 'Complete' },
      { anchorId: 3, englishName: 'Leviticus', osisId: 3, chapterCount: 27, status: 'Partial' },
      { anchorId: 4, englishName: 'Numbers', osisId: 4, chapterCount: 36, status: 'Partial' },
      { anchorId: 5, englishName: 'Deuteronomy', osisId: 5, chapterCount: 34, status: 'Complete' },
      { anchorId: 6, englishName: 'Joshua', osisId: 6, chapterCount: 24, status: 'Complete' },
      { anchorId: 7, englishName: 'Judges', osisId: 7, chapterCount: 21, status: 'Complete' },
      { anchorId: 8, englishName: 'Ruth', osisId: 8, chapterCount: 4, status: 'Complete' },
      { anchorId: 9, englishName: '1 Samuel', osisId: 9, chapterCount: 31, status: 'Complete' },
      { anchorId: 10, englishName: '2 Samuel', osisId: 10, chapterCount: 24, status: 'Complete' },
      { anchorId: 11, englishName: '1 Kings', osisId: 11, chapterCount: 22, status: 'Complete' },
      { anchorId: 12, englishName: '2 Kings', osisId: 12, chapterCount: 25, status: 'Complete' },
      { anchorId: 13, englishName: '1 Chronicles', osisId: 13, chapterCount: 29, status: 'Partial' },
      { anchorId: 14, englishName: '2 Chronicles', osisId: 14, chapterCount: 36, status: 'Partial' },
      { anchorId: 15, englishName: 'Ezra', osisId: 15, chapterCount: 10, status: 'Complete' },
      { anchorId: 16, englishName: 'Nehemiah', osisId: 16, chapterCount: 13, status: 'Complete' },
      { anchorId: 17, englishName: 'Esther', osisId: 17, chapterCount: 10, status: 'Complete' },
      { anchorId: 18, englishName: 'Job', osisId: 18, chapterCount: 42, status: 'Complete' },
      { anchorId: 19, englishName: 'Psalms', osisId: 19, chapterCount: 150, status: 'Complete' },
      { anchorId: 20, englishName: 'Proverbs', osisId: 20, chapterCount: 31, status: 'Complete' },
      { anchorId: 21, englishName: 'Ecclesiastes', osisId: 21, chapterCount: 12, status: 'Complete' },
      { anchorId: 22, englishName: 'Song of Solomon', osisId: 22, chapterCount: 8, status: 'Complete' },
      { anchorId: 23, englishName: 'Isaiah', osisId: 23, chapterCount: 66, status: 'Complete' },
      { anchorId: 24, englishName: 'Jeremiah', osisId: 24, chapterCount: 52, status: 'Partial' },
      { anchorId: 25, englishName: 'Lamentations', osisId: 25, chapterCount: 5, status: 'Complete' },
      { anchorId: 26, englishName: 'Ezekiel', osisId: 26, chapterCount: 48, status: 'Partial' },
      { anchorId: 27, englishName: 'Daniel', osisId: 27, chapterCount: 12, status: 'Complete' },
      { anchorId: 28, englishName: 'Hosea', osisId: 28, chapterCount: 14, status: 'Complete' },
      { anchorId: 29, englishName: 'Joel', osisId: 29, chapterCount: 3, status: 'Complete' },
      { anchorId: 30, englishName: 'Amos', osisId: 30, chapterCount: 9, status: 'Complete' },
      { anchorId: 31, englishName: 'Obadiah', osisId: 31, chapterCount: 1, status: 'Complete' },
      { anchorId: 32, englishName: 'Jonah', osisId: 32, chapterCount: 4, status: 'Complete' },
      { anchorId: 33, englishName: 'Micah', osisId: 33, chapterCount: 7, status: 'Complete' },
      { anchorId: 34, englishName: 'Nahum', osisId: 34, chapterCount: 3, status: 'Complete' },
      { anchorId: 35, englishName: 'Habakkuk', osisId: 35, chapterCount: 3, status: 'Complete' },
      { anchorId: 36, englishName: 'Zephaniah', osisId: 36, chapterCount: 3, status: 'Complete' },
      { anchorId: 37, englishName: 'Haggai', osisId: 37, chapterCount: 2, status: 'Complete' },
      { anchorId: 38, englishName: 'Zechariah', osisId: 38, chapterCount: 14, status: 'Complete' },
      { anchorId: 39, englishName: 'Malachi', osisId: 39, chapterCount: 4, status: 'Complete' }
    ];

    // New Testament Books
    const ntBooks: BibleBookMapping[] = [
      { anchorId: 40, englishName: 'Matthew', osisId: 40, chapterCount: 28, status: 'Complete' },
      { anchorId: 41, englishName: 'Mark', osisId: 41, chapterCount: 16, status: 'Complete' },
      { anchorId: 42, englishName: 'Luke', osisId: 42, chapterCount: 24, status: 'Complete' },
      { anchorId: 43, englishName: 'John', osisId: 43, chapterCount: 21, status: 'Complete' },
      { anchorId: 44, englishName: 'Acts', osisId: 44, chapterCount: 28, status: 'Complete' },
      { anchorId: 45, englishName: 'Romans', osisId: 45, chapterCount: 16, status: 'Complete' },
      { anchorId: 46, englishName: '1 Corinthians', osisId: 46, chapterCount: 16, status: 'Complete' },
      { anchorId: 47, englishName: '2 Corinthians', osisId: 47, chapterCount: 13, status: 'Complete' },
      { anchorId: 48, englishName: 'Galatians', osisId: 48, chapterCount: 6, status: 'Complete' },
      { anchorId: 49, englishName: 'Ephesians', osisId: 49, chapterCount: 6, status: 'Complete' },
      { anchorId: 50, englishName: 'Philippians', osisId: 50, chapterCount: 4, status: 'Complete' },
      { anchorId: 51, englishName: 'Colossians', osisId: 51, chapterCount: 4, status: 'Complete' },
      { anchorId: 52, englishName: '1 Thessalonians', osisId: 52, chapterCount: 5, status: 'Complete' },
      { anchorId: 53, englishName: '2 Thessalonians', osisId: 53, chapterCount: 3, status: 'Complete' },
      { anchorId: 54, englishName: '1 Timothy', osisId: 54, chapterCount: 6, status: 'Complete' },
      { anchorId: 55, englishName: '2 Timothy', osisId: 55, chapterCount: 4, status: 'Complete' },
      { anchorId: 56, englishName: 'Titus', osisId: 56, chapterCount: 3, status: 'Complete' },
      { anchorId: 57, englishName: 'Philemon', osisId: 57, chapterCount: 1, status: 'Complete' },
      { anchorId: 58, englishName: 'Hebrews', osisId: 58, chapterCount: 13, status: 'Complete' },
      { anchorId: 59, englishName: 'James', osisId: 59, chapterCount: 5, status: 'Complete' },
      { anchorId: 60, englishName: '1 Peter', osisId: 60, chapterCount: 5, status: 'Complete' },
      { anchorId: 61, englishName: '2 Peter', osisId: 61, chapterCount: 3, status: 'Complete' },
      { anchorId: 62, englishName: '1 John', osisId: 62, chapterCount: 5, status: 'Complete' },
      { anchorId: 63, englishName: '2 John', osisId: 63, chapterCount: 1, status: 'Complete' },
      { anchorId: 64, englishName: '3 John', osisId: 64, chapterCount: 1, status: 'Complete' },
      { anchorId: 65, englishName: 'Jude', osisId: 65, chapterCount: 1, status: 'Complete' },
      { anchorId: 66, englishName: 'Revelation', osisId: 66, chapterCount: 22, status: 'Complete' }
    ];

    // Populate the map
    [...otBooks, ...ntBooks].forEach(book => {
      this.bookMappings.set(book.anchorId, book);
    });
  }

  /**
   * Get all available book mappings
   */
  public getBookMappings(): BibleBookMapping[] {
    return Array.from(this.bookMappings.values());
  }

  /**
   * Validate if a book ID exists
   */
  public isValidBookId(bookId: number): boolean {
    return this.bookMappings.has(bookId);
  }
} 