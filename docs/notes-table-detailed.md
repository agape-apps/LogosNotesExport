# Notes Table Detailed Analysis
Generated: Tue Jul  8 20:02:19 PST 2025

## Notes Table Overview

- **Total Notes:** 1048

## Schema
```sql
CREATE TABLE Notes (
	Id integer primary key autoincrement,
	NotesDocumentId integer not null,
	CompressedUserTitle blob,
	CompressedContent blob not null,
	Rank integer not null,
	Level int not null,
	Color int,
	MarkupKind int not null,
	MarkupStyleName text,
	Tags text,
	IndicatorKind int not null,
	Created text not null,
	Modified text not null,
	SyncId guid not null,
	Revision guid not null,
	ImportId text,
	IsSubmitted bool not null,
	Extra blob
);
CREATE INDEX Notes_NotesDocumentIdRank on Notes(NotesDocumentId, Rank);
CREATE INDEX Notes_ImportId on Notes(ImportId);
CREATE INDEX Notes_SyncId on Notes(SyncId);
CREATE INDEX Notes_MarkupStyleName on Notes(MarkupStyleName);
```

## Column Information

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Id | INTEGER | 0 |  | 1 |
| NotesDocumentId | INTEGER | 1 |  | 0 |
| CompressedUserTitle | BLOB | 0 |  | 0 |
| CompressedContent | BLOB | 1 |  | 0 |
| Rank | INTEGER | 1 |  | 0 |
| Level | INT | 1 |  | 0 |
| Color | INT | 0 |  | 0 |
| MarkupKind | INT | 1 |  | 0 |
| MarkupStyleName | TEXT | 0 |  | 0 |
| Tags | TEXT | 0 |  | 0 |
| IndicatorKind | INT | 1 |  | 0 |
| Created | TEXT | 1 |  | 0 |
| Modified | TEXT | 1 |  | 0 |
| SyncId | guid | 1 |  | 0 |
| Revision | guid | 1 |  | 0 |
| ImportId | TEXT | 0 |  | 0 |
| IsSubmitted | bool | 1 |  | 0 |
| Extra | BLOB | 0 |  | 0 |

## Sample Notes Data

### First 5 Notes (truncated for readability)
```
```

## Statistics

- **Notes with Titles:** 
- **Notes with Content:** 

- **ID Range:** 1 - 1048

