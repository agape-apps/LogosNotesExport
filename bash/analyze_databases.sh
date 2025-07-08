#!/bin/bash

# Logos Database Analysis Script
# Read-only analysis of Notes and NotesTool databases

NOTES_DB="./LogosDocuments/Documents/Notes/notes.db"
NOTESTOOL_DB="./LogosDocuments/NotesToolManager/notestool.db"
OUTPUT_DIR="./docs"

echo "🚀 Starting Logos Database Analysis (Read-Only Mode)"
echo "======================================================"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to analyze database structure
analyze_database() {
    local db_path="$1"
    local db_name="$2"
    local output_file="$3"
    
    echo "📊 Analyzing $db_name..."
    echo "Database: $db_path"
    
    if [ ! -f "$db_path" ]; then
        echo "❌ Database file not found: $db_path"
        return 1
    fi
    
    {
        echo "# $db_name Analysis Report"
        echo "Generated: $(date)"
        echo ""
        echo "## Database Information"
        echo "- **Path:** \`$db_path\`"
        echo "- **Size:** $(ls -lh "$db_path" | awk '{print $5}')"
        echo ""
        
        echo "## Tables Overview"
        echo ""
        echo "| Table Name | Row Count |"
        echo "|------------|-----------|"
        
        # Get all tables and their row counts
        sqlite3 "$db_path" -readonly ".tables" | tr ' ' '\n' | while read table; do
            if [ ! -z "$table" ]; then
                count=$(sqlite3 "$db_path" -readonly "SELECT COUNT(*) FROM [$table];" 2>/dev/null || echo "N/A")
                echo "| $table | $count |"
            fi
        done
        
        echo ""
        echo "## Detailed Table Schemas"
        echo ""
        
        # Analyze each table schema
        sqlite3 "$db_path" -readonly ".tables" | tr ' ' '\n' | while read table; do
            if [ ! -z "$table" ]; then
                echo "### Table: $table"
                echo ""
                echo "**Schema:**"
                echo '```sql'
                sqlite3 "$db_path" -readonly ".schema [$table]"
                echo '```'
                echo ""
                
                echo "**Column Information:**"
                echo ""
                echo "| Column | Type | Not Null | Default | Primary Key |"
                echo "|--------|------|----------|---------|-------------|"
                sqlite3 "$db_path" -readonly "PRAGMA table_info([$table]);" | while IFS='|' read cid name type notnull dflt_value pk; do
                    echo "| $name | $type | $notnull | $dflt_value | $pk |"
                done
                echo ""
                
                # Sample data for smaller tables
                row_count=$(sqlite3 "$db_path" -readonly "SELECT COUNT(*) FROM [$table];" 2>/dev/null || echo "0")
                if [ "$row_count" -le 100 ] && [ "$row_count" -gt 0 ]; then
                    echo "**Sample Data (first 3 rows):**"
                    echo '```'
                    sqlite3 "$db_path" -readonly -header "SELECT * FROM [$table] LIMIT 3;"
                    echo '```'
                elif [ "$row_count" -gt 0 ]; then
                    echo "**Sample Data (first 3 rows of $row_count total):**"
                    echo '```'
                    sqlite3 "$db_path" -readonly -header "SELECT * FROM [$table] LIMIT 3;"
                    echo '```'
                fi
                echo ""
            fi
        done
        
    } > "$output_file"
    
    echo "✅ $db_name analysis saved to $output_file"
}

# Function to analyze Notes table specifically
analyze_notes_table() {
    local db_path="$1"
    local output_file="$2"
    
    echo "📝 Analyzing Notes table in detail..."
    
    if [ ! -f "$db_path" ]; then
        echo "❌ Database file not found: $db_path"
        return 1
    fi
    
    {
        echo "# Notes Table Detailed Analysis"
        echo "Generated: $(date)"
        echo ""
        
        # Check if Notes table exists
        table_exists=$(sqlite3 "$db_path" -readonly "SELECT name FROM sqlite_master WHERE type='table' AND name='Notes';" | wc -l)
        
        if [ "$table_exists" -eq 0 ]; then
            echo "❌ Notes table not found in database"
            return 1
        fi
        
        echo "## Notes Table Overview"
        echo ""
        
        # Get total count
        total_notes=$(sqlite3 "$db_path" -readonly "SELECT COUNT(*) FROM Notes;")
        echo "- **Total Notes:** $total_notes"
        echo ""
        
        # Get schema
        echo "## Schema"
        echo '```sql'
        sqlite3 "$db_path" -readonly ".schema Notes"
        echo '```'
        echo ""
        
        # Column details
        echo "## Column Information"
        echo ""
        echo "| Column | Type | Not Null | Default | Primary Key |"
        echo "|--------|------|----------|---------|-------------|"
        sqlite3 "$db_path" -readonly "PRAGMA table_info(Notes);" | while IFS='|' read cid name type notnull dflt_value pk; do
            echo "| $name | $type | $notnull | $dflt_value | $pk |"
        done
        echo ""
        
        # Sample notes
        echo "## Sample Notes Data"
        echo ""
        echo "### First 5 Notes (truncated for readability)"
        echo '```'
        sqlite3 "$db_path" -readonly -header "SELECT Id, Title, SUBSTR(Content, 1, 100) as Content_Preview, Created, Modified FROM Notes LIMIT 5;"
        echo '```'
        echo ""
        
        # Statistics
        echo "## Statistics"
        echo ""
        echo "- **Notes with Titles:** $(sqlite3 "$db_path" -readonly "SELECT COUNT(*) FROM Notes WHERE Title IS NOT NULL AND Title != '';")"
        echo "- **Notes with Content:** $(sqlite3 "$db_path" -readonly "SELECT COUNT(*) FROM Notes WHERE Content IS NOT NULL AND Content != '';")"
        echo ""
        
        # ID range
        min_id=$(sqlite3 "$db_path" -readonly "SELECT MIN(Id) FROM Notes;")
        max_id=$(sqlite3 "$db_path" -readonly "SELECT MAX(Id) FROM Notes;")
        echo "- **ID Range:** $min_id - $max_id"
        echo ""
        
    } > "$output_file"
    
    echo "✅ Notes table analysis saved to $output_file"
}

# Function to analyze NoteAnchorFacetReferences table
analyze_anchor_references() {
    local db_path="$1"
    local output_file="$2"
    
    echo "🔗 Analyzing NoteAnchorFacetReferences table..."
    
    if [ ! -f "$db_path" ]; then
        echo "❌ Database file not found: $db_path"
        return 1
    fi
    
    {
        echo "# NoteAnchorFacetReferences Table Analysis"
        echo "Generated: $(date)"
        echo ""
        
        # Check if table exists
        table_exists=$(sqlite3 "$db_path" -readonly "SELECT name FROM sqlite_master WHERE type='table' AND name='NoteAnchorFacetReferences';" | wc -l)
        
        if [ "$table_exists" -eq 0 ]; then
            echo "❌ NoteAnchorFacetReferences table not found in database"
            return 1
        fi
        
        echo "## Table Overview"
        echo ""
        
        # Get total count
        total_refs=$(sqlite3 "$db_path" -readonly "SELECT COUNT(*) FROM NoteAnchorFacetReferences;")
        echo "- **Total Anchor References:** $total_refs"
        echo ""
        
        # Get schema
        echo "## Schema"
        echo '```sql'
        sqlite3 "$db_path" -readonly ".schema NoteAnchorFacetReferences"
        echo '```'
        echo ""
        
        # Column details
        echo "## Column Information"
        echo ""
        echo "| Column | Type | Not Null | Default | Primary Key |"
        echo "|--------|------|----------|---------|-------------|"
        sqlite3 "$db_path" -readonly "PRAGMA table_info(NoteAnchorFacetReferences);" | while IFS='|' read cid name type notnull dflt_value pk; do
            echo "| $name | $type | $notnull | $dflt_value | $pk |"
        done
        echo ""
        
        # Sample data
        echo "## Sample Reference Data"
        echo ""
        echo "### First 10 References"
        echo '```'
        sqlite3 "$db_path" -readonly -header "SELECT * FROM NoteAnchorFacetReferences LIMIT 10;"
        echo '```'
        echo ""
        
        # Reference patterns
        echo "## Reference Pattern Analysis"
        echo ""
        echo "### Reference Column Patterns (first part before first dot)"
        echo ""
        echo "| Pattern | Count |"
        echo "|---------|-------|"
        sqlite3 "$db_path" -readonly "
        SELECT 
            CASE 
                WHEN Reference LIKE 'bible+%' THEN 'bible+*'
                WHEN Reference LIKE 'libronix:%' THEN 'libronix:*'
                ELSE SUBSTR(Reference, 1, INSTR(Reference || '.', '.') - 1)
            END as pattern,
            COUNT(*) as count
        FROM NoteAnchorFacetReferences 
        WHERE Reference IS NOT NULL
        GROUP BY pattern
        ORDER BY count DESC;" | while IFS='|' read pattern count; do
            echo "| $pattern | $count |"
        done
        echo ""
        
        # Bible references specifically
        echo "### Bible Reference Analysis"
        echo ""
        bible_count=$(sqlite3 "$db_path" -readonly "SELECT COUNT(*) FROM NoteAnchorFacetReferences WHERE Reference LIKE 'bible+%';")
        echo "- **Total Bible References:** $bible_count"
        echo ""
        
        if [ "$bible_count" -gt 0 ]; then
            echo "### Sample Bible References"
            echo '```'
            sqlite3 "$db_path" -readonly "SELECT Reference FROM NoteAnchorFacetReferences WHERE Reference LIKE 'bible+%' LIMIT 10;"
            echo '```'
            echo ""
            
            echo "### Bible Book Number Analysis"
            echo ""
            echo "Analyzing the book numbers in bible references (format: bible+version.book.chapter.verse)"
            echo ""
            echo "| Book Number | Count | Sample Reference |"
            echo "|-------------|-------|------------------|"
            sqlite3 "$db_path" -readonly "
            SELECT 
                SUBSTR(Reference, 
                    LENGTH('bible+') + INSTR(SUBSTR(Reference, LENGTH('bible+') + 1), '.') + 1,
                    INSTR(SUBSTR(Reference, LENGTH('bible+') + INSTR(SUBSTR(Reference, LENGTH('bible+') + 1), '.') + 2), '.') - 1
                ) as book_number,
                COUNT(*) as count,
                Reference as sample
            FROM NoteAnchorFacetReferences 
            WHERE Reference LIKE 'bible+%.%.%'
            GROUP BY book_number
            ORDER BY CAST(book_number AS INTEGER);" | while IFS='|' read book_num count sample; do
                echo "| $book_num | $count | $sample |"
            done
        fi
        echo ""
        
    } > "$output_file"
    
    echo "✅ Anchor references analysis saved to $output_file"
}

# Function to find database relationships
analyze_relationships() {
    local notes_db="$1"
    local notestool_db="$2"
    local output_file="$3"
    
    echo "🔍 Analyzing database relationships..."
    
    {
        echo "# Database Relationships Analysis"
        echo "Generated: $(date)"
        echo ""
        
        echo "## ID Relationship Analysis"
        echo ""
        
        # Get Notes IDs
        notes_count=$(sqlite3 "$notes_db" -readonly "SELECT COUNT(*) FROM Notes;" 2>/dev/null || echo "0")
        if [ "$notes_count" -gt 0 ]; then
            notes_min=$(sqlite3 "$notes_db" -readonly "SELECT MIN(Id) FROM Notes;")
            notes_max=$(sqlite3 "$notes_db" -readonly "SELECT MAX(Id) FROM Notes;")
            echo "### Notes Database"
            echo "- **Total Notes:** $notes_count"
            echo "- **ID Range:** $notes_min - $notes_max"
            echo ""
        fi
        
        # Get Anchor References with NoteId
        anchor_count=$(sqlite3 "$notestool_db" -readonly "SELECT COUNT(*) FROM NoteAnchorFacetReferences;" 2>/dev/null || echo "0")
        if [ "$anchor_count" -gt 0 ]; then
            # Check if NoteId column exists
            noteid_exists=$(sqlite3 "$notestool_db" -readonly "PRAGMA table_info(NoteAnchorFacetReferences);" | grep -c "NoteId")
            
            echo "### NotesTool Database"
            echo "- **Total Anchor References:** $anchor_count"
            
            if [ "$noteid_exists" -gt 0 ]; then
                anchor_min=$(sqlite3 "$notestool_db" -readonly "SELECT MIN(NoteId) FROM NoteAnchorFacetReferences WHERE NoteId IS NOT NULL;")
                anchor_max=$(sqlite3 "$notestool_db" -readonly "SELECT MAX(NoteId) FROM NoteAnchorFacetReferences WHERE NoteId IS NOT NULL;")
                echo "- **NoteId Range:** $anchor_min - $anchor_max"
                
                # Find matching IDs
                if [ "$notes_count" -gt 0 ] && [ "$anchor_count" -gt 0 ]; then
                    echo ""
                    echo "## ID Matching Analysis"
                    echo ""
                    
                    # Create temporary files for ID comparison
                    temp_notes_ids="/tmp/notes_ids.txt"
                    temp_anchor_ids="/tmp/anchor_ids.txt"
                    
                    sqlite3 "$notes_db" -readonly "SELECT Id FROM Notes ORDER BY Id;" > "$temp_notes_ids"
                    sqlite3 "$notestool_db" -readonly "SELECT DISTINCT NoteId FROM NoteAnchorFacetReferences WHERE NoteId IS NOT NULL ORDER BY NoteId;" > "$temp_anchor_ids"
                    
                    matching_count=$(comm -12 "$temp_notes_ids" "$temp_anchor_ids" | wc -l)
                    
                    echo "- **Matching IDs:** $matching_count"
                    echo "- **Notes without Anchors:** $((notes_count - matching_count))"
                    
                    if [ "$matching_count" -gt 0 ]; then
                        echo ""
                        echo "### Sample Matching IDs"
                        echo '```'
                        comm -12 "$temp_notes_ids" "$temp_anchor_ids" | head -10
                        echo '```'
                    fi
                    
                    # Cleanup
                    rm -f "$temp_notes_ids" "$temp_anchor_ids"
                fi
            else
                echo "- **Note:** NoteId column not found in NoteAnchorFacetReferences table"
            fi
            echo ""
        fi
        
    } > "$output_file"
    
    echo "✅ Relationship analysis saved to $output_file"
}

# Function to decode Bible references
decode_bible_references() {
    local db_path="$1"
    local output_file="$2"
    
    echo "📖 Decoding Bible references..."
    
    {
        echo "# Bible Reference Decoder Analysis"
        echo "Generated: $(date)"
        echo ""
        
        echo "## Bible Reference Format Analysis"
        echo ""
        echo "Format appears to be: \`bible+version.book.chapter.verse(-endverse)\`"
        echo ""
        
        echo "### Sample References with Breakdown"
        echo ""
        echo "| Full Reference | Version | Book# | Chapter | Verse | Breakdown |"
        echo "|----------------|---------|--------|---------|-------|-----------|"
        
        sqlite3 "$db_path" -readonly "
        SELECT Reference
        FROM NoteAnchorFacetReferences 
        WHERE Reference LIKE 'bible+%' 
        LIMIT 20;" | while read ref; do
            if [ ! -z "$ref" ]; then
                # Parse the reference
                version=$(echo "$ref" | sed -n 's/bible+\([^.]*\)\..*/\1/p')
                rest=$(echo "$ref" | sed -n 's/bible+[^.]*\.\(.*\)/\1/p')
                book=$(echo "$rest" | cut -d'.' -f1)
                chapter=$(echo "$rest" | cut -d'.' -f2)
                verse=$(echo "$rest" | cut -d'.' -f3)
                
                # Try to determine book name based on number
                book_name="Unknown"
                case "$book" in
                    "63") book_name="2 John" ;;
                    "61") book_name="Matthew" ;;
                    "1") book_name="Genesis" ;;
                    "2") book_name="Exodus" ;;
                    "19") book_name="Psalms" ;;
                    "20") book_name="Proverbs" ;;
                    "23") book_name="Isaiah" ;;
                    "40") book_name="Matthew" ;;
                    "43") book_name="John" ;;
                    "45") book_name="Romans" ;;
                    "46") book_name="1 Corinthians" ;;
                    "49") book_name="Ephesians" ;;
                    "50") book_name="Philippians" ;;
                    "51") book_name="Colossians" ;;
                    "58") book_name="Hebrews" ;;
                    "59") book_name="James" ;;
                    "60") book_name="1 Peter" ;;
                    "61") book_name="2 Peter" ;;
                    "62") book_name="1 John" ;;
                    "63") book_name="2 John" ;;
                    "64") book_name="3 John" ;;
                    "65") book_name="Jude" ;;
                    "66") book_name="Revelation" ;;
                esac
                
                echo "| $ref | $version | $book | $chapter | $verse | $book_name $chapter:$verse |"
            fi
        done
        
        echo ""
        echo "## Book Number Mapping (Based on Analysis)"
        echo ""
        echo "| Book Number | Likely Book Name | Count |"
        echo "|-------------|------------------|-------|"
        
        sqlite3 "$db_path" -readonly "
        SELECT 
            SUBSTR(Reference, 
                LENGTH('bible+') + INSTR(SUBSTR(Reference, LENGTH('bible+') + 1), '.') + 1,
                INSTR(SUBSTR(Reference, LENGTH('bible+') + INSTR(SUBSTR(Reference, LENGTH('bible+') + 1), '.') + 2), '.') - 1
            ) as book_number,
            COUNT(*) as count
        FROM NoteAnchorFacetReferences 
        WHERE Reference LIKE 'bible+%.%.%'
        GROUP BY book_number
        ORDER BY CAST(book_number AS INTEGER);" | while IFS='|' read book_num count; do
            
            book_name="Unknown"
            case "$book_num" in
                "1") book_name="Genesis" ;;
                "2") book_name="Exodus" ;;
                "3") book_name="Leviticus" ;;
                "4") book_name="Numbers" ;;
                "5") book_name="Deuteronomy" ;;
                "6") book_name="Joshua" ;;
                "7") book_name="Judges" ;;
                "8") book_name="Ruth" ;;
                "9") book_name="1 Samuel" ;;
                "10") book_name="2 Samuel" ;;
                "11") book_name="1 Kings" ;;
                "12") book_name="2 Kings" ;;
                "13") book_name="1 Chronicles" ;;
                "14") book_name="2 Chronicles" ;;
                "15") book_name="Ezra" ;;
                "16") book_name="Nehemiah" ;;
                "17") book_name="Esther" ;;
                "18") book_name="Job" ;;
                "19") book_name="Psalms" ;;
                "20") book_name="Proverbs" ;;
                "21") book_name="Ecclesiastes" ;;
                "22") book_name="Song of Songs" ;;
                "23") book_name="Isaiah" ;;
                "24") book_name="Jeremiah" ;;
                "25") book_name="Lamentations" ;;
                "26") book_name="Ezekiel" ;;
                "27") book_name="Daniel" ;;
                "28") book_name="Hosea" ;;
                "29") book_name="Joel" ;;
                "30") book_name="Amos" ;;
                "31") book_name="Obadiah" ;;
                "32") book_name="Jonah" ;;
                "33") book_name="Micah" ;;
                "34") book_name="Nahum" ;;
                "35") book_name="Habakkuk" ;;
                "36") book_name="Zephaniah" ;;
                "37") book_name="Haggai" ;;
                "38") book_name="Zechariah" ;;
                "39") book_name="Malachi" ;;
                "40") book_name="Matthew" ;;
                "41") book_name="Mark" ;;
                "42") book_name="Luke" ;;
                "43") book_name="John" ;;
                "44") book_name="Acts" ;;
                "45") book_name="Romans" ;;
                "46") book_name="1 Corinthians" ;;
                "47") book_name="2 Corinthians" ;;
                "48") book_name="Galatians" ;;
                "49") book_name="Ephesians" ;;
                "50") book_name="Philippians" ;;
                "51") book_name="Colossians" ;;
                "52") book_name="1 Thessalonians" ;;
                "53") book_name="2 Thessalonians" ;;
                "54") book_name="1 Timothy" ;;
                "55") book_name="2 Timothy" ;;
                "56") book_name="Titus" ;;
                "57") book_name="Philemon" ;;
                "58") book_name="Hebrews" ;;
                "59") book_name="James" ;;
                "60") book_name="1 Peter" ;;
                "61") book_name="2 Peter" ;;
                "62") book_name="1 John" ;;
                "63") book_name="2 John" ;;
                "64") book_name="3 John" ;;
                "65") book_name="Jude" ;;
                "66") book_name="Revelation" ;;
            esac
            
            echo "| $book_num | $book_name | $count |"
        done
        
        echo ""
        echo "## Reference Examples with Decoded Names"
        echo ""
        echo "Based on your examples:"
        echo "- \`bible+nkjv.63.14.12-63.14.14\` = **2 John 1:12-14** (NKJV)"
        echo "- \`bible+nkjv.61.24.14\` = **2 Peter 2:14** (NKJV) - not Matthew as suggested"
        echo ""
        echo "Note: Book 61 appears to be 2 Peter, not Matthew (which would be book 40)."
        echo ""
        
    } > "$output_file"
    
    echo "✅ Bible reference decoding saved to $output_file"
}

# Main execution
echo ""
echo "Starting analysis of Logos databases..."
echo ""

# Analyze Notes database
analyze_database "$NOTES_DB" "Notes Database" "$OUTPUT_DIR/notes-database-analysis.md"

# Analyze NotesTool database  
analyze_database "$NOTESTOOL_DB" "NotesTool Database" "$OUTPUT_DIR/notestool-database-analysis.md"

# Deep analysis of Notes table
analyze_notes_table "$NOTES_DB" "$OUTPUT_DIR/notes-table-detailed.md"

# Deep analysis of NoteAnchorFacetReferences table
analyze_anchor_references "$NOTESTOOL_DB" "$OUTPUT_DIR/anchor-references-analysis.md"

# Analyze relationships between databases
analyze_relationships "$NOTES_DB" "$NOTESTOOL_DB" "$OUTPUT_DIR/database-relationships.md"

# Decode Bible references
decode_bible_references "$NOTESTOOL_DB" "$OUTPUT_DIR/bible-reference-decoder.md"

echo ""
echo "🎉 All analyses complete!"
echo "📁 Results saved to $OUTPUT_DIR directory:"
echo "   - notes-database-analysis.md"
echo "   - notestool-database-analysis.md" 
echo "   - notes-table-detailed.md"
echo "   - anchor-references-analysis.md"
echo "   - database-relationships.md"
echo "   - bible-reference-decoder.md"
echo "" 