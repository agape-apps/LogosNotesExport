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

### First few Notes (decoded and reformatted)
```
5: OrangeHighlighter
<Paragraph><Run Text="to those who love Me and keep My commandments. "/></Paragraph>

<Paragraph FlowDirection="LeftToRight" FontSize="10" xml:lang="en-us" Margin="0,0,0,0" TextAlignment="Left"><Run Text="Love and commandments go hand in hand" /></Paragraph>

7: None
<Paragraph><Run Text="Introduction"/></Paragraph>

[DECODE ERROR: Error: Could not decode format 0x01]

8: None
<Paragraph><Run Text="And you will hear of wars and rumors of wars. See that you are not troubled; for all these things must come to pass, but the end is not yet.  For nation will rise against nation, and kingdom against k"/></Paragraph>

<Paragraph FlowDirection="LeftToRight" FontSize="10" xml:lang="en-us" Margin="0,0,0,0" TextAlignment="Left"><Run Text="Do not be troubled" /></Paragraph><Paragraph FlowDirection="LeftToRight" FontSize="10" xml:lang="en-us" Margin="0,0,0,0" TextAlignment="Left"><Run Text="These things must come to pass" /></Paragraph>

9: None
<Paragraph><Run Text="earthen vessels"/></Paragraph>

<Paragraph FlowDirection="LeftToRight" FontSize="10" xml:lang="en-us" Margin="0,0,0,0" TextAlignment="Left"><Run Text="Clay jars - Jer 18:1-3" /></Paragraph>

10: OrangeHighlighter
<Span><Run Text="Finally, brethren, whatever things are ﻿l﻿true, whatever things are ﻿m﻿noble, whatever things are ﻿n﻿just, ﻿o﻿whatever things are pure, whatever things are ﻿p﻿lovely, whatever things are of good report, if there is any virtue and if there is anything praiseworthy—meditate on these things." /></Span>


11: OrangeHighlighter
<Paragraph><Run Text="You have heaped up treasure in the last days. ﻿4﻿ Indeed ﻿e﻿the wages of the laborers who mowed your fields, which you kept back by fraud, cry out; and ﻿f﻿the cries of the reapers have reached the ears of the Lord of ﻿2﻿Sabaoth. "/></Paragraph>

```

## Statistics

- **Notes with Titles:** 
- **Notes with Content:** 

- **ID Range:** 1 - 1048

