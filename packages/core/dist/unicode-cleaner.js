/**
 * Unicode cleaning utilities for Logos notes export
 * TODO: Simplify this! This is probably removing too much.
 * We should only remove the zero-width characters and control characters.
 */
const DEFAULT_OPTIONS = {
    removeZeroWidth: true,
    removeControlChars: true,
    removeFootnoteMarkers: true,
    enableAdvancedCleaning: true,
};
export class UnicodeCleaner {
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    /**
     * Clean problematic Unicode characters that display as question marks or cause formatting issues
     */
    cleanText(text) {
        if (!text) {
            return text;
        }
        let cleaned = text;
        // Step 1: Remove zero-width characters and other problematic Unicode
        if (this.options.removeZeroWidth) {
            cleaned = this.removeZeroWidthCharacters(cleaned);
        }
        // Step 2: Remove control characters except common ones
        if (this.options.removeControlChars) {
            cleaned = this.removeControlCharacters(cleaned);
        }
        // TODO: Disabled for now as it also removed (trimmed) required spaces.
        // Step 3: Remove footnote markers and cross-reference artifacts
        // if (this.options.removeFootnoteMarkers) {
        //   cleaned = this.removeFootnoteMarkers(cleaned);
        // }
        // Step 4: Apply advanced cleaning patterns
        // if (this.options.enableAdvancedCleaning) {
        //   cleaned = this.applyAdvancedCleaning(cleaned);
        // }
        return cleaned;
    }
    /**
     * Remove zero-width characters and other invisible Unicode
     */
    removeZeroWidthCharacters(text) {
        const problematicChars = [
            '\u200b', // Zero-width space
            '\u200c', // Zero-width non-joiner
            '\u200d', // Zero-width joiner
            '\u200e', // Left-to-right mark
            '\u200f', // Right-to-left mark
            '\u2060', // Word joiner
            '\ufeff', // Zero-width no-break space (BOM)
            '\u00ad', // Soft hyphen
            '\u061c', // Arabic letter mark
            '\u180e', // Mongolian vowel separator
            '\u2061', // Function application
            '\u2062', // Invisible times
            '\u2063', // Invisible separator
            '\u2064', // Invisible plus
        ];
        for (const char of problematicChars) {
            text = text.replace(new RegExp(char, 'g'), '');
        }
        return text;
    }
    /**
     * Remove control characters except tab, newline, carriage return
     */
    removeControlCharacters(text) {
        // Remove control characters (U+0000 to U+001F and U+007F to U+009F)
        // except tab (U+0009), line feed (U+000A), and carriage return (U+000D)
        return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    }
    /**
     * Remove footnote markers and cross-reference artifacts from Logos
     * These appear as single letters/numbers followed by common words
     * TODO: This is probably not needed.
     */
    removeFootnoteMarkers(text) {
        // Comprehensive patterns for footnote artifacts
        const crossRefPatterns = [
            // Single letter + common biblical/theological words
            /\b[a-z](?:true|false|noble|just|pure|lovely|whatever|things)\b/gi,
            /\b[a-z](?:the|and|that|with|will|shall|have|was|were|are)\b/gi,
            /\b[a-z](?:you|your|his|her|their|who|which|when|where|what)\b/gi,
            /\b[a-z](?:how|why|all|every|any|some|many|much|into|unto)\b/gi,
            /\b[a-z](?:upon|from|before|after|above|below|through|between)\b/gi,
            /\b[a-z](?:Lord|God|Jesus|Christ|Spirit|Father|Son|Holy)\b/gi,
            /\b[a-z](?:gospel|faith|grace|mercy|love|hope|peace|joy)\b/gi,
            /\b[a-z](?:salvation|righteousness|holiness|blessing|covenant)\b/gi,
            /\b[a-z](?:indeed|wages|cries|hearken|unto|behold|verily)\b/gi,
            // Number + common words (for numbered footnotes)
            /\b\d+(?:Sabaoth|the|and|that|will|shall|Lord|God|unto|into)\b/gi,
            /\b\d+(?:indeed|wages|cries|behold|verily|hearken|blessed)\b/gi,
            // Greek letter + words (for manuscript variants)
            /\b[αβγδεζηθικλμνξοπρστυφχψω](?:the|and|that|will|shall)\b/gi,
            // Hebrew letter + words (for textual notes)
            /\b[אבגדהוזחטיכלמנסעפצקרשת](?:the|and|that|will|shall)\b/gi,
            // Special characters + words
            /\b[*†‡§¶#](?:the|and|that|will|shall|Lord|God)\b/gi,
            // Superscript numbers/letters + words
            /\b[⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ](?:the|and|that|will|shall)\b/gi,
        ];
        // Remove the prefixed characters from these patterns
        for (const pattern of crossRefPatterns) {
            text = text.replace(pattern, (match) => {
                // Extract the word part (everything after the first character)
                return match.slice(1);
            });
        }
        return text;
    }
    /**
     * Apply additional cleaning patterns for specific Logos artifacts
     */
    applyAdvancedCleaning(text) {
        let cleaned = text;
        // Remove sequences of zero-width chars around single characters
        cleaned = cleaned.replace(/[\ufeff\u200b-\u200f\u2060]+(.?)[\ufeff\u200b-\u200f\u2060]+/g, '$1');
        // Clean up malformed words that result from footnote removal
        // Pattern: letter followed immediately by capital letter (likely merged words)
        cleaned = cleaned.replace(/\b([a-z])([A-Z][a-z]+)\b/g, '$2');
        // Remove isolated single characters that are likely footnote remnants
        // but preserve meaningful single letters (I, a, A)
        cleaned = cleaned.replace(/\b(?![IiAa])[a-z]\b/g, '');
        // Clean up multiple spaces that result from removals
        cleaned = cleaned.replace(/\s{2,}/g, ' ');
        // Remove spaces before punctuation
        cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');
        // Clean up leading/trailing whitespace
        cleaned = cleaned.trim();
        // Remove empty parentheses or brackets that might remain
        cleaned = cleaned.replace(/\(\s*\)/g, '');
        cleaned = cleaned.replace(/\[\s*\]/g, '');
        cleaned = cleaned.replace(/\{\s*\}/g, '');
        return cleaned;
    }
    /**
     * Specifically clean Rich Text (XAML) text content
     */
    cleanXamlText(xamlText) {
        if (!xamlText)
            return xamlText;
        // First decode HTML entities that might be hiding problematic characters
        let cleaned = xamlText
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
            .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        // Apply standard cleaning
        cleaned = this.cleanText(cleaned);
        return cleaned;
    }
    /**
     * Clean text extracted from Text attributes in Rich Text (XAML)
     */
    cleanExtractedText(texts) {
        return texts
            .map(text => this.cleanXamlText(text))
            .filter(text => text && text.trim() !== '');
    }
}
/**
 * Convenience function for quick text cleaning with default options
 */
export function cleanUnicodeText(text) {
    const cleaner = new UnicodeCleaner();
    return cleaner.cleanText(text);
}
/**
 * Convenience function for cleaning Rich Text (XAML) text content
 */
export function cleanXamlText(xamlText) {
    const cleaner = new UnicodeCleaner();
    return cleaner.cleanXamlText(xamlText);
}
