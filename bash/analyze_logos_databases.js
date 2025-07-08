const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database paths
const notesDbPath = './LogosDocuments/Documents/Notes/notes.db';
const notesToolDbPath = './LogosDocuments/NotesToolManager/notestool.db';

function analyzeDatabase(dbPath, dbName) {
    console.log(`\n=== Analyzing ${dbName} ===`);
    console.log(`Path: ${dbPath}`);
    
    if (!fs.existsSync(dbPath)) {
        console.log(`❌ Database file not found: ${dbPath}`);
        return null;
    }
    
    try {
        // Open database in read-only mode
        const db = new Database(dbPath, { readonly: true });
        
        // Get all table names
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
        
        console.log(`\n📋 Tables found: ${tables.length}`);
        tables.forEach(table => console.log(`  - ${table.name}`));
        
        const result = {
            dbName,
            dbPath,
            tables: tables.map(t => t.name),
            tableDetails: {}
        };
        
        // Analyze each table
        tables.forEach(table => {
            const tableName = table.name;
            console.log(`\n🔍 Analyzing table: ${tableName}`);
            
            try {
                // Get table schema
                const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
                console.log(`  Columns: ${schema.length}`);
                schema.forEach(col => {
                    console.log(`    - ${col.name} (${col.type}) ${col.pk ? '[PRIMARY KEY]' : ''} ${col.notnull ? '[NOT NULL]' : ''}`);
                });
                
                // Get row count
                const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
                console.log(`  Row count: ${count.count}`);
                
                // Get sample data (first 3 rows)
                const sampleData = db.prepare(`SELECT * FROM ${tableName} LIMIT 3`).all();
                
                result.tableDetails[tableName] = {
                    schema,
                    rowCount: count.count,
                    sampleData
                };
                
                if (sampleData.length > 0) {
                    console.log(`  Sample data (first row):`);
                    Object.entries(sampleData[0]).forEach(([key, value]) => {
                        const displayValue = typeof value === 'string' && value.length > 100 
                            ? value.substring(0, 100) + '...' 
                            : value;
                        console.log(`    ${key}: ${displayValue}`);
                    });
                }
                
            } catch (error) {
                console.log(`    ❌ Error analyzing table ${tableName}: ${error.message}`);
                result.tableDetails[tableName] = {
                    error: error.message
                };
            }
        });
        
        db.close();
        return result;
        
    } catch (error) {
        console.log(`❌ Error opening database: ${error.message}`);
        return null;
    }
}

function analyzeNotesTable(dbPath) {
    console.log(`\n=== Deep Analysis of Notes Table ===`);
    
    if (!fs.existsSync(dbPath)) {
        console.log(`❌ Database file not found: ${dbPath}`);
        return null;
    }
    
    try {
        const db = new Database(dbPath, { readonly: true });
        
        // Check if Notes table exists
        const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Notes'").get();
        if (!tableExists) {
            console.log(`❌ Notes table not found in database`);
            db.close();
            return null;
        }
        
        // Get all Notes data
        const notes = db.prepare("SELECT * FROM Notes").all();
        console.log(`📝 Total notes found: ${notes.length}`);
        
        if (notes.length > 0) {
            console.log(`\nSample notes (first 3):`);
            notes.slice(0, 3).forEach((note, index) => {
                console.log(`\n--- Note ${index + 1} ---`);
                Object.entries(note).forEach(([key, value]) => {
                    const displayValue = typeof value === 'string' && value.length > 200 
                        ? value.substring(0, 200) + '...' 
                        : value;
                    console.log(`  ${key}: ${displayValue}`);
                });
            });
        }
        
        db.close();
        return notes;
        
    } catch (error) {
        console.log(`❌ Error analyzing Notes table: ${error.message}`);
        return null;
    }
}

function analyzeNoteAnchorFacetReferences(dbPath) {
    console.log(`\n=== Deep Analysis of NoteAnchorFacetReferences Table ===`);
    
    if (!fs.existsSync(dbPath)) {
        console.log(`❌ Database file not found: ${dbPath}`);
        return null;
    }
    
    try {
        const db = new Database(dbPath, { readonly: true });
        
        // Check if table exists
        const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='NoteAnchorFacetReferences'").get();
        if (!tableExists) {
            console.log(`❌ NoteAnchorFacetReferences table not found in database`);
            db.close();
            return null;
        }
        
        // Get all data
        const references = db.prepare("SELECT * FROM NoteAnchorFacetReferences").all();
        console.log(`🔗 Total anchor references found: ${references.length}`);
        
        if (references.length > 0) {
            console.log(`\nSample references (first 5):`);
            references.slice(0, 5).forEach((ref, index) => {
                console.log(`\n--- Reference ${index + 1} ---`);
                Object.entries(ref).forEach(([key, value]) => {
                    console.log(`  ${key}: ${value}`);
                });
            });
            
            // Analyze Reference column patterns
            console.log(`\n🔍 Analyzing Reference column patterns:`);
            const referencePatterns = {};
            references.forEach(ref => {
                if (ref.Reference) {
                    const pattern = ref.Reference.split('.')[0] || 'unknown';
                    referencePatterns[pattern] = (referencePatterns[pattern] || 0) + 1;
                }
            });
            
            console.log(`Reference patterns found:`);
            Object.entries(referencePatterns).forEach(([pattern, count]) => {
                console.log(`  - ${pattern}: ${count} occurrences`);
            });
        }
        
        db.close();
        return references;
        
    } catch (error) {
        console.log(`❌ Error analyzing NoteAnchorFacetReferences table: ${error.message}`);
        return null;
    }
}

function findDatabaseRelationships(notesData, anchorData) {
    console.log(`\n=== Analyzing Database Relationships ===`);
    
    if (!notesData || !anchorData) {
        console.log(`❌ Missing data for relationship analysis`);
        return null;
    }
    
    // Look for common ID fields
    const notesFields = notesData.length > 0 ? Object.keys(notesData[0]) : [];
    const anchorFields = anchorData.length > 0 ? Object.keys(anchorData[0]) : [];
    
    console.log(`Notes table fields: ${notesFields.join(', ')}`);
    console.log(`Anchor table fields: ${anchorFields.join(', ')}`);
    
    // Find common fields
    const commonFields = notesFields.filter(field => anchorFields.includes(field));
    console.log(`Common fields: ${commonFields.join(', ')}`);
    
    // Look for ID relationships
    const relationships = [];
    
    // Check if any notes IDs match anchor IDs or vice versa
    const notesIds = notesData.map(note => note.Id || note.ID || note.id).filter(id => id !== undefined);
    const anchorIds = anchorData.map(anchor => anchor.Id || anchor.ID || anchor.id).filter(id => id !== undefined);
    const anchorNoteIds = anchorData.map(anchor => anchor.NoteId || anchor.NoteID || anchor.noteId).filter(id => id !== undefined);
    
    console.log(`\nID Analysis:`);
    console.log(`Notes IDs range: ${Math.min(...notesIds)} - ${Math.max(...notesIds)} (${notesIds.length} total)`);
    console.log(`Anchor IDs range: ${Math.min(...anchorIds)} - ${Math.max(...anchorIds)} (${anchorIds.length} total)`);
    console.log(`Anchor Note IDs range: ${Math.min(...anchorNoteIds)} - ${Math.max(...anchorNoteIds)} (${anchorNoteIds.length} total)`);
    
    // Check for matches
    const matchingIds = notesIds.filter(id => anchorNoteIds.includes(id));
    console.log(`Matching IDs between Notes.Id and Anchors.NoteId: ${matchingIds.length}`);
    
    return {
        commonFields,
        notesFields,
        anchorFields,
        matchingIds: matchingIds.length,
        totalMatches: matchingIds
    };
}

// Main execution
async function main() {
    console.log('🚀 Starting Logos Database Analysis');
    console.log('📖 Read-only mode enabled for all operations');
    
    // Analyze both databases
    const notesDbResult = analyzeDatabase(notesDbPath, 'Notes Database');
    const notesToolDbResult = analyzeDatabase(notesToolDbPath, 'Notes Tool Database');
    
    // Deep analysis of specific tables
    const notesData = analyzeNotesTable(notesDbPath);
    const anchorData = analyzeNoteAnchorFacetReferences(notesToolDbPath);
    
    // Analyze relationships
    const relationships = findDatabaseRelationships(notesData, anchorData);
    
    // Save results
    const results = {
        timestamp: new Date().toISOString(),
        databases: {
            notes: notesDbResult,
            notesTool: notesToolDbResult
        },
        detailedAnalysis: {
            notesTable: notesData ? notesData.slice(0, 10) : null, // First 10 notes
            anchorTable: anchorData ? anchorData.slice(0, 20) : null, // First 20 anchors
        },
        relationships
    };
    
    // Write results to JSON file for further processing
    fs.writeFileSync('database_analysis_results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Results saved to database_analysis_results.json');
    
    console.log('\n✅ Analysis complete!');
}

main().catch(console.error);

