import { gunzipSync, inflateSync } from 'zlib';

/**
 * Decode a Logos compressed content string from base64
 */
export function decodeLogosContent(base64String: string): string {
  try {
    if (!base64String || base64String.trim() === '') {
      return '';
    }

    // Decode base64 to buffer
    const data = Buffer.from(base64String.trim(), 'base64');
    
    if (data.length < 5) {
      return 'Error: Data too short';
    }

    // Check the first byte to determine format
    const formatByte = data[0];
    
    if (formatByte === undefined) {
      return 'Error: Unable to read format byte';
    }

    if (formatByte === 0x02) {
      // Format with 5-byte header - uncompressed UTF-8 data
      const content = data.subarray(5).toString('utf-8');
      return content;
    } else if (formatByte === 0x01) {
      // Format with 5-byte header - gzip compressed data
      try {
        // Skip 5 bytes and decompress with gzip
        const decompressed = gunzipSync(data.subarray(5));
        return decompressed.toString('utf-8');
      } catch (e) {
        // Fallback: try different skip amounts with gzip
        for (const skipBytes of [4, 6, 7]) {
          try {
            const decompressed = gunzipSync(data.subarray(skipBytes));
            return decompressed.toString('utf-8');
          } catch {
            continue;
          }
        }

        // Fallback: try zlib decompression (inflate)
        for (const skipBytes of [4, 5, 6]) {
          try {
            const decompressed = inflateSync(data.subarray(skipBytes));
            return decompressed.toString('utf-8');
          } catch {
            continue;
          }
        }

        return `Error: Could not decode format 0x${formatByte.toString(16).padStart(2, '0')} - ${e}`;
      }
    } else {
      // Try different decompression methods for unknown formats
      
      // Try gzip with different skip amounts first
      for (const skipBytes of [1, 4, 5, 6]) {
        try {
          const decompressed = gunzipSync(data.subarray(skipBytes));
          return decompressed.toString('utf-8');
        } catch {
          continue;
        }
      }

      // Try zlib with different skip amounts
      for (const skipBytes of [1, 4, 5, 6]) {
        try {
          const decompressed = inflateSync(data.subarray(skipBytes));
          return decompressed.toString('utf-8');
        } catch {
          continue;
        }
      }

      // Try raw UTF-8 with different skip amounts
      for (const skipBytes of [1, 4, 5, 6]) {
        try {
          return data.subarray(skipBytes).toString('utf-8');
        } catch {
          continue;
        }
      }

      return `Error: Unknown format 0x${formatByte.toString(16).padStart(2, '0')}, tried multiple decompression methods`;
    }
  } catch (e) {
    return `Error decoding: ${e}`;
  }
}

/**
 * Clean problematic Unicode characters from text
 */
export function cleanUnicodeText(text: string): string {
  if (!text) {
    return text;
  }

  // Remove zero-width characters and other problematic Unicode
  const problematicChars = [
    '\u200b',  // Zero-width space
    '\u200c',  // Zero-width non-joiner
    '\u200d',  // Zero-width joiner
    '\u200e',  // Left-to-right mark
    '\u200f',  // Right-to-left mark
    '\u2060',  // Word joiner
    '\ufeff',  // Zero-width no-break space (BOM)
    '\u00ad',  // Soft hyphen
  ];

  for (const char of problematicChars) {
    text = text.replace(new RegExp(char, 'g'), '');
  }

  // Remove any remaining control characters except common ones (tab, newline, carriage return)
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // Clean up cross-reference markers that create nonsensical words
  const crossRefPatterns = [
    // Single letter + common words
    /\b[a-z]true\b/gi, /\b[a-z]false\b/gi, /\b[a-z]noble\b/gi, /\b[a-z]just\b/gi,
    /\b[a-z]pure\b/gi, /\b[a-z]lovely\b/gi, /\b[a-z]whatever\b/gi, /\b[a-z]things\b/gi,
    /\b[a-z]the\b/gi, /\b[a-z]and\b/gi, /\b[a-z]that\b/gi, /\b[a-z]with\b/gi,
    /\b[a-z]will\b/gi, /\b[a-z]shall\b/gi, /\b[a-z]have\b/gi, /\b[a-z]was\b/gi,
    /\b[a-z]were\b/gi, /\b[a-z]are\b/gi, /\b[a-z]you\b/gi, /\b[a-z]your\b/gi,
    /\b[a-z]his\b/gi, /\b[a-z]her\b/gi, /\b[a-z]their\b/gi, /\b[a-z]who\b/gi,
    /\b[a-z]which\b/gi, /\b[a-z]when\b/gi, /\b[a-z]where\b/gi, /\b[a-z]what\b/gi,
    /\b[a-z]how\b/gi, /\b[a-z]why\b/gi, /\b[a-z]all\b/gi, /\b[a-z]every\b/gi,
    /\b[a-z]any\b/gi, /\b[a-z]some\b/gi, /\b[a-z]many\b/gi, /\b[a-z]much\b/gi,
    /\b[a-z]into\b/gi, /\b[a-z]unto\b/gi, /\b[a-z]upon\b/gi, /\b[a-z]from\b/gi,
    /\b[a-z]before\b/gi, /\b[a-z]after\b/gi, /\b[a-z]above\b/gi, /\b[a-z]below\b/gi,
    /\b[a-z]Lord\b/gi, /\b[a-z]God\b/gi, /\b[a-z]Jesus\b/gi, /\b[a-z]Christ\b/gi,
    /\b[a-z]Spirit\b/gi, /\b[a-z]Father\b/gi, /\b[a-z]Son\b/gi, /\b[a-z]Holy\b/gi,
    
    // Number + common words
    /\b\d+Sabaoth\b/gi, /\b\d+the\b/gi, /\b\d+and\b/gi, /\b\d+that\b/gi,
    /\b\d+will\b/gi, /\b\d+shall\b/gi, /\b\d+Lord\b/gi, /\b\d+God\b/gi,
    
    // Specific patterns observed
    /\b[a-z]Indeed\b/gi, /\b[a-z]wages\b/gi, /\b[a-z]cries\b/gi
  ];

  // Remove the prefixed letters/numbers from these patterns
  for (const pattern of crossRefPatterns) {
    text = text.replace(pattern, (match) => match.slice(1));
  }

  // Additional cleanup for any remaining sequences of zero-width chars around single characters
  text = text.replace(/[\ufeff\u200b-\u200f\u2060]+(.?)[\ufeff\u200b-\u200f\u2060]+/g, '$1');

  return text;
}

/**
 * Convert XAML content to plain text (simplified version)
 * For now, just extract text content without full markdown conversion
 */
export function xamlToPlainText(xmlContent: string): string {
  if (!xmlContent || xmlContent.startsWith('Error:')) {
    return xmlContent;
  }

  try {
    // Simple text extraction using regex for Text attributes
    const textMatches = xmlContent.match(/Text="([^"]*)"/g);
    if (textMatches) {
      const texts = textMatches
        .map(match => match.replace(/^Text="/, '').replace(/"$/, ''))
        .map(text => 
          // Decode HTML entities
          text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        )
        .map(text => cleanUnicodeText(text))
        .filter(text => text.trim() !== '');
      
      return texts.join(' ');
    }

    // Fallback: return cleaned content
    return cleanUnicodeText(xmlContent);
  } catch (e) {
    return cleanUnicodeText(xmlContent);
  }
} 