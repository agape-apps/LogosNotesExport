/**
 * Unicode cleaning utilities for Logos notes export
 * TODO: Simplify this! This is probably removing too much.
 * We should only remove the zero-width characters and control characters.
 */
export interface UnicodeCleanerOptions {
    /** Remove zero-width characters */
    removeZeroWidth: boolean;
    /** Remove control characters (except tab, newline, carriage return) */
    removeControlChars: boolean;
    /** Remove footnote markers and cross-reference artifacts */
    removeFootnoteMarkers: boolean;
    /** Apply additional cleanup patterns */
    enableAdvancedCleaning: boolean;
}
export declare class UnicodeCleaner {
    private options;
    constructor(options?: Partial<UnicodeCleanerOptions>);
    /**
     * Clean problematic Unicode characters that display as question marks or cause formatting issues
     */
    cleanText(text: string): string;
    /**
     * Remove zero-width characters and other invisible Unicode
     */
    private removeZeroWidthCharacters;
    /**
     * Remove control characters except tab, newline, carriage return
     */
    private removeControlCharacters;
    /**
     * Remove footnote markers and cross-reference artifacts from Logos
     * These appear as single letters/numbers followed by common words
     * TODO: This is probably not needed.
     */
    private removeFootnoteMarkers;
    /**
     * Apply additional cleaning patterns for specific Logos artifacts
     */
    private applyAdvancedCleaning;
    /**
     * Specifically clean Rich Text (XAML) text content
     */
    cleanXamlText(xamlText: string): string;
    /**
     * Clean text extracted from Text attributes in Rich Text (XAML)
     */
    cleanExtractedText(texts: string[]): string[];
}
/**
 * Convenience function for quick text cleaning with default options
 */
export declare function cleanUnicodeText(text: string): string;
/**
 * Convenience function for cleaning Rich Text (XAML) text content
 */
export declare function cleanXamlText(xamlText: string): string;
