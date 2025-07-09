#!/usr/bin/env python3
"""
Script to decode compressed content from Logos Notes export.

Usage:
    python3 decode_logos_notes.py "base64_string"
    python3 decode_logos_notes.py --file NotesTable.json [--field CompressedUserTitle] [--markdown]
"""

import sys
import json
import base64
import argparse
import zlib
import gzip
import xml.etree.ElementTree as ET
import html
import re
import unicodedata

def clean_unicode_text(text):
    """Clean problematic Unicode characters that display as question marks."""
    if not text:
        return text
    
    # Remove zero-width characters and other problematic Unicode
    problematic_chars = [
        '\u200b',  # Zero-width space
        '\u200c',  # Zero-width non-joiner
        '\u200d',  # Zero-width joiner
        '\u200e',  # Left-to-right mark
        '\u200f',  # Right-to-left mark
        '\u2060',  # Word joiner
        '\ufeff',  # Zero-width no-break space (BOM)
        '\u00ad',  # Soft hyphen
    ]
    
    for char in problematic_chars:
        text = text.replace(char, '')
    
    # Remove any remaining control characters except common ones (tab, newline, carriage return)
    text = ''.join(char for char in text if not unicodedata.category(char).startswith('C') or char in '\t\n\r')
    
    # Clean up cross-reference markers that create nonsensical words
    # This targets patterns like: ltrue, mnoble, njust, owhatever, plovely, ethe, fthe, 2Sabaoth
    # These are single letters/numbers followed by common words that got merged due to removed zero-width chars
    
    
    # Remove the prefixed letters/numbers from these patterns
    for pattern in cross_ref_patterns:
        # Replace pattern with the word without the prefix
        text = re.sub(pattern, lambda m: m.group()[1:], text, flags=re.IGNORECASE)
    
    # Additional cleanup for any remaining sequences of zero-width chars around single characters
    text = re.sub(r'[\ufeff\u200b-\u200f\u2060]+(.?)[\ufeff\u200b-\u200f\u2060]+', r'\1', text)
    
    return text

def xml_to_markdown(xml_content):
    """Convert XAML content to Markdown format."""
    if not xml_content or xml_content.startswith("Error:"):
        return xml_content
    
    try:
        # Wrap content in root element if it's not already wrapped
        if not xml_content.strip().startswith('<'):
            return clean_unicode_text(xml_content)
            
        # Handle multiple root elements by wrapping them
        if xml_content.count('<?xml') > 0:
            # Remove XML declaration if present
            xml_content = re.sub(r'<\?xml[^>]*\?>', '', xml_content)
        
        # Check if we have multiple root elements
        root_count = len(re.findall(r'<(?:Paragraph|Span|Run)[^>]*(?:/>|>)', xml_content))
        if root_count > 1 or not xml_content.strip().startswith('<'):
            xml_content = f"<Root>{xml_content}</Root>"
        
        # Parse XML
        root = ET.fromstring(xml_content)
        
        def extract_text_with_formatting(element, parent_bold=False, parent_italic=False):
            """Recursively extract text with formatting."""
            result = []
            
            # Check current element's formatting
            is_bold = parent_bold or element.get('FontWeight') == 'Bold' or element.get('FontBold') == 'True'
            is_italic = parent_italic or element.get('FontStyle') == 'Italic' or element.get('FontItalic') == 'True'
            
            # Handle Run elements with Text attribute
            if element.tag == 'Run' and element.get('Text'):
                text = element.get('Text')
                # Decode HTML entities and clean Unicode
                text = html.unescape(text)
                text = clean_unicode_text(text)
                
                # Apply formatting
                if is_bold and is_italic:
                    text = f"***{text}***"
                elif is_bold:
                    text = f"**{text}**"
                elif is_italic:
                    text = f"*{text}*"
                
                result.append(text)
            
            # Handle text content within elements
            if element.text:
                text = element.text.strip()
                if text:
                    text = html.unescape(text)
                    text = clean_unicode_text(text)
                    if is_bold and is_italic:
                        text = f"***{text}***"
                    elif is_bold:
                        text = f"**{text}**"
                    elif is_italic:
                        text = f"*{text}*"
                    result.append(text)
            
            # Process child elements
            for child in element:
                child_text = extract_text_with_formatting(child, is_bold, is_italic)
                result.extend(child_text)
                
                # Add tail text if present
                if child.tail:
                    tail_text = child.tail.strip()
                    if tail_text:
                        tail_text = html.unescape(tail_text)
                        tail_text = clean_unicode_text(tail_text)
                        if is_bold and is_italic:
                            tail_text = f"***{tail_text}***"
                        elif is_bold:
                            tail_text = f"**{tail_text}**"
                        elif is_italic:
                            tail_text = f"*{tail_text}*"
                        result.append(tail_text)
            
            return result
        
        # Extract all text content
        all_text = []
        
        def process_element(element):
            """Process elements and add paragraph breaks."""
            text_parts = extract_text_with_formatting(element)
            if text_parts:
                line_text = ''.join(text_parts).strip()
                if line_text:
                    all_text.append(line_text)
            
            # Process child elements at the same level for Paragraph elements
            if element.tag in ['Root', 'Paragraph']:
                for child in element:
                    if child.tag == 'Paragraph':
                        process_element(child)
        
        # Handle different root structures
        if root.tag == 'Root':
            # Multiple elements wrapped in Root
            for child in root:
                if child.tag == 'Paragraph':
                    process_element(child)
                else:
                    # Single non-paragraph element
                    text_parts = extract_text_with_formatting(child)
                    if text_parts:
                        line_text = ''.join(text_parts).strip()
                        if line_text:
                            all_text.append(line_text)
        else:
            # Single root element
            process_element(root)
        
        # Join with double newlines for paragraph breaks
        markdown_text = '\n\n'.join(all_text)
        
        # Clean up extra whitespace
        markdown_text = re.sub(r'\n{3,}', '\n\n', markdown_text)
        markdown_text = re.sub(r' +', ' ', markdown_text)
        
        # Final Unicode cleanup
        markdown_text = clean_unicode_text(markdown_text)
        
        return markdown_text.strip()
        
    except ET.ParseError as e:
        # If XML parsing fails, try to extract text using regex
        try:
            # Extract text from Text attributes
            text_matches = re.findall(r'Text="([^"]*)"', xml_content)
            if text_matches:
                # Decode HTML entities, clean Unicode, and join
                decoded_texts = [clean_unicode_text(html.unescape(text)) for text in text_matches]
                return ' '.join(decoded_texts)
            else:
                # Fallback: return original content with Unicode cleanup
                return clean_unicode_text(xml_content)
        except Exception:
            return f"[Markdown conversion error: {e}]\n{clean_unicode_text(xml_content)}"
    except Exception as e:
        return f"[Markdown conversion error: {e}]\n{clean_unicode_text(xml_content)}"

def decode_logos_content(base64_string):
    """Decode a Logos compressed content string."""
    try:
        # Decode base64
        data = base64.b64decode(base64_string.strip())
        
        if len(data) < 5:
            return "Error: Data too short"
        
        # Check the first byte to determine format
        format_byte = data[0]
        
        if format_byte == 0x02:
            # Format with 5-byte header - uncompressed UTF-8 data
            content = data[5:].decode('utf-8')
            return content
        elif format_byte == 0x01:
            # Format with 5-byte header - gzip compressed data
            try:
                # Skip 5 bytes and decompress with gzip
                decompressed = gzip.decompress(data[5:])
                return decompressed.decode('utf-8')
            except Exception as e:
                # Fallback: try different skip amounts with gzip
                for skip_bytes in [4, 6, 7]:
                    try:
                        decompressed = gzip.decompress(data[skip_bytes:])
                        return decompressed.decode('utf-8')
                    except:
                        continue
                
                # Fallback: try zlib decompression
                for skip_bytes in [4, 5, 6]:
                    try:
                        decompressed = zlib.decompress(data[skip_bytes:])
                        return decompressed.decode('utf-8')
                    except:
                        continue
                        
                return f"Error: Could not decode format 0x{format_byte:02x} - {e}"
        else:
            # Try different decompression methods for unknown formats
            
            # Try gzip with different skip amounts first
            for skip_bytes in [1, 4, 5, 6]:
                try:
                    decompressed = gzip.decompress(data[skip_bytes:])
                    return decompressed.decode('utf-8')
                except:
                    continue
            
            # Try zlib with different skip amounts
            for skip_bytes in [1, 4, 5, 6]:
                try:
                    decompressed = zlib.decompress(data[skip_bytes:])
                    return decompressed.decode('utf-8')
                except:
                    continue
            
            # Try raw UTF-8 with different skip amounts
            for skip_bytes in [1, 4, 5, 6]:
                try:
                    return data[skip_bytes:].decode('utf-8')
                except:
                    continue
                    
            return f"Error: Unknown format 0x{format_byte:02x}, tried multiple decompression methods"
            
    except Exception as e:
        return f"Error decoding: {e}"

def main():
    parser = argparse.ArgumentParser(description='Decode Logos Notes compressed content')
    parser.add_argument('input', nargs='?', help='Base64 string to decode')
    parser.add_argument('--file', help='JSON file to process')
    parser.add_argument('--field', default='CompressedUserTitle', 
                       choices=['CompressedContent', 'CompressedUserTitle'],
                       help='Field to decode from JSON (default: CompressedUserTitle)')
    parser.add_argument('--id', type=int, help='Specific note ID to decode')
    parser.add_argument('--show-errors', action='store_true', help='Show entries that failed to decode')
    parser.add_argument('--markdown', action='store_true', help='Convert XAML to Markdown format')
    
    args = parser.parse_args()
    
    if args.input:
        # Decode single string
        result = decode_logos_content(args.input)
        if args.markdown:
            result = xml_to_markdown(result)
        print(result)
    elif args.file:
        # Process JSON file
        try:
            with open(args.file, 'r') as f:
                notes = json.load(f)
            
            for note in notes:
                note_id = note.get('Id', 'Unknown')
                compressed_field = note.get(args.field, '')
                
                # Skip if specific ID requested and doesn't match
                if args.id is not None and note_id != args.id:
                    continue
                
                if compressed_field:
                    decoded = decode_logos_content(compressed_field)
                    
                    # Convert to markdown if requested
                    if args.markdown:
                        decoded = xml_to_markdown(decoded)
                    
                    # Skip errors unless requested
                    if decoded.startswith("Error:") and not args.show_errors:
                        continue
                        
                    print(f"Note ID {note_id} ({args.field}):")
                    print(decoded)
                    print("-" * 80)
                    
                    # If specific ID requested, break after finding it
                    if args.id is not None:
                        break
                        
        except Exception as e:
            print(f"Error processing file: {e}")
    else:
        print("Please provide either a base64 string or --file option")
        parser.print_help()

if __name__ == '__main__':
    main() 