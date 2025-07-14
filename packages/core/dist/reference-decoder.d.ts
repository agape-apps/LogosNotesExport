export interface BibleBookMapping {
    anchorId: number;
    englishName: string;
    osisAbbr: string;
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
    reference: string;
    anchorBookId: number;
    formatted: string;
}
export declare class BibleReferenceDecoder {
    private bookMappings;
    constructor();
    /**
     * Decode a Logos Bible reference string into human-readable format
     * Example input: "bible+nkjv.61.24.14" (Anchor format)
     * Example output: "1 Peter 24:14"
     */
    decodeReference(reference: string, anchorBookId?: number): DecodedReference | null;
    /**
     * Get book name from anchor book ID
     */
    getBookName(anchorBookId: number): string;
    /**
     * Decode Logos "bible+version.book.chapter.verse" format
     */
    private decodeBiblePlusReference;
    /**
     * Decode simple dotted reference format
     */
    private decodeDottedReference;
    /**
     * Decode simple reference (fallback)
     */
    private decodeSimpleReference;
    /**
     * Format reference into human-readable string
     */
    private formatReference;
    /**
     * Initialize Bible book mappings from the anchor documentation
     * Based on docs/anchor-complete-ot-nt-mapping.md
     */
    private initializeBookMappings;
    /**
     * Get all available book mappings
     */
    getBookMappings(): BibleBookMapping[];
    /**
     * Validate if a book ID exists
     */
    isValidBookId(bookId: number): boolean;
    /**
     * Get OSIS abbreviation for a book
     */
    getOsisAbbr(anchorBookId: number): string;
    /**
     * Get Bible section prefix based on anchor book ID
     * OT: 1-39, AP: 40-60, NT: 61-87
     */
    getBibleSectionPrefix(anchorBookId: number): string;
    /**
     * Generate filename for Bible reference in the new format
     * Format: OT02_Exod-06.10.md
     */
    generateBibleFilename(anchorBookId: number, chapter: number, verse?: number): string;
    /**
     * Generate simple filename for frontmatter (kebab-case)
     * Format: "1-samuel-8-5"
     * TODO: this may not be needed.
     */
    generateSimpleFilename(bookName: string, chapter: number, verse?: number): string;
}
