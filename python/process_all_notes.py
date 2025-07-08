#!/usr/bin/env python3
"""
Process all Logos Notes and output decoded content to a plain text file.

Usage:
    python3 process_all_notes.py [input_file] [output_file] [--markdown]
    
Default: input_file=NotesTable.json, output_file=decoded_notes.txt
"""

import sys
import json
import base64
import zlib
import argparse
from decode_logos_notes import decode_logos_content, xml_to_markdown

def process_all_notes(input_file="NotesTable.json", output_file="decoded_notes.txt", markdown_format=False):
    """Process all notes and write decoded content to output file."""
    
    try:
        # Read the JSON file
        with open(input_file, 'r') as f:
            notes = json.load(f)
        
        # Open output file for writing
        with open(output_file, 'w', encoding='utf-8') as out:
            processed_count = 0
            skipped_count = 0
            
            for note in notes:
                note_id = note.get('Id', 'Unknown')
                markup_style = note.get('MarkupStyleName', 'None')
                compressed_content = note.get('CompressedContent', '')
                compressed_title = note.get('CompressedUserTitle', '')
                
                # Skip if both fields are empty
                if not compressed_content and not compressed_title:
                    skipped_count += 1
                    continue
                
                # Decode the fields
                decoded_title = ""
                decoded_content = ""
                
                if compressed_title:
                    decoded_title = decode_logos_content(compressed_title)
                    # Convert to markdown if requested
                    if markdown_format:
                        decoded_title = xml_to_markdown(decoded_title)
                    # Clean up error messages for display
                    if decoded_title.startswith("Error:"):
                        decoded_title = f"[DECODE ERROR: {decoded_title}]"
                
                if compressed_content:
                    decoded_content = decode_logos_content(compressed_content)
                    # Convert to markdown if requested
                    if markdown_format:
                        decoded_content = xml_to_markdown(decoded_content)
                    # Clean up error messages for display
                    if decoded_content.startswith("Error:"):
                        decoded_content = f"[DECODE ERROR: {decoded_content}]"
                
                # Write to output file with new format
                out.write(f"### {note_id}: {markup_style}\n\n")  # Markdown heading with double newline
                if decoded_title:
                    out.write(f"{decoded_title}\n\n")  # Title with double newline
                if decoded_content:
                    out.write(f"{decoded_content}\n\n")  # Content with double newline
                
                # Add separator with blank lines before and after
                out.write("---\n\n")
                
                processed_count += 1
        
        format_type = "Markdown" if markdown_format else "XAML"
        print(f"✅ Processing complete!")
        print(f"📝 Processed {processed_count} notes in {format_type} format")
        print(f"⏭️ Skipped {skipped_count} empty notes")
        print(f"💾 Output written to: {output_file}")
        
    except FileNotFoundError as e:
        print(f"❌ Error: File not found - {e}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Process all Logos Notes and output decoded content')
    parser.add_argument('input_file', nargs='?', default='NotesTable.json', 
                       help='Input JSON file (default: NotesTable.json)')
    parser.add_argument('output_file', nargs='?', default='decoded_notes.txt',
                       help='Output text file (default: decoded_notes.txt)')
    parser.add_argument('--markdown', action='store_true', 
                       help='Convert XAML to Markdown format for human readability')
    
    args = parser.parse_args()
    
    print(f"🔄 Processing {args.input_file}...")
    print(f"📄 Output file: {args.output_file}")
    if args.markdown:
        print(f"✨ Format: Markdown (human-readable)")
    else:
        print(f"📋 Format: Raw XAML")
    print()
    
    process_all_notes(args.input_file, args.output_file, args.markdown)

if __name__ == '__main__':
    main() 