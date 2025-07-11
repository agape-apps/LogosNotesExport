# Notes Database Analysis Report
Generated: Tue Jul  8 20:02:04 PST 2025

## Database Information
- **Path:** `./LogosDocuments/Documents/Notes/notes.db`
- **Size:** 1.7M

## Tables Overview

| Table Name | Row Count |
|------------|-----------|
| Attachments | 1043 |
| Labels | 0 |
| SyncInfo | 6 |
| DownloadedNotes | 0 |
| Notes | 1048 |
| SyncInfoVersion | 1 |
| Info | 1 |
| NotesDocuments | 64 |
| SyncItemsToPatch | 64 |
| LabelAttributeValues | 0 |
| Properties | 1 |
| LabelAttributes | 0 |
| RenameOperations | 0 |

## Detailed Table Schemas

### Table: Attachments

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Id | INTEGER | 0 |  | 1 |
| NoteId | INTEGER | 1 |  | 0 |
| Kind | INT | 1 |  | 0 |
| ResourceId | TEXT | 0 |  | 0 |
| SavedTextRange | TEXT | 0 |  | 0 |
| DataTypeName | TEXT | 0 |  | 0 |
| DataTypeReference | TEXT | 0 |  | 0 |
| Headword | TEXT | 0 |  | 0 |
| HeadwordLanguage | TEXT | 0 |  | 0 |
| UniversalTextRangeId | TEXT | 0 |  | 0 |
| UniversalTextRangeVersion | TEXT | 0 |  | 0 |
| UniversalTextRangeOffset | INT | 0 |  | 0 |
| UniversalTextRangeLength | INT | 0 |  | 0 |
| ReferenceSortKey | BLOB | 0 |  | 0 |
| PositionSortKey | BLOB | 0 |  | 0 |
| Rank | INT | 1 | 0 | 0 |
| WordNumbers | BLOB | 0 |  | 0 |

**Sample Data (first 3 rows of 1043 total):**
```
Id|NoteId|Kind|ResourceId|SavedTextRange|DataTypeName|DataTypeReference|Headword|HeadwordLanguage|UniversalTextRangeId|UniversalTextRangeVersion|UniversalTextRangeOffset|UniversalTextRangeLength|ReferenceSortKey|PositionSortKey|Rank|WordNumbers
1|1|4|LLS:HLMNILLBBLDICT|EndPosition=Article%3dS.SEVENWORD%7cArticleLength%3d1611%7cContext%3d%2520THE%2520CROSS%2520Statement%7cOffset%3d26%7cOffsetInContext%3d10|Resource=LLS:HLMNILLBBLDICT|StartPosition=Article%3dS.SEVENWORD%7cArticleLength%3d1611%7cContext%3dSEVEN%2520WORD%7cOffset%3d0%7cOffsetInContext%3d0|Version=2009-10-27T23:42:33Z|||||||||||0|
2|2|4|LLS:1.0.30|EndPosition=Article%3dNKJV.1PE.1.2.SUB%7cArticleLength%3d1576%7cContext%3dm%2520the%2520dead,%2520Ôªø4Ôªø%2520to%2520a%7cOffset%3d224%7cOffsetInContext%3d10|Resource=LLS:1.0.30|StartPosition=Article%3dNKJV.1PE.1.2.SUB%7cArticleLength%3d1576%7cContext%3dcy%2520ÔªøjÔªøhas%2520begotten%2520u%7cOffset%3d132%7cOffsetInContext%3d10|Version=2012-01-24T00:51:40Z|||||||||||0|
3|5|4|LLS:1.0.30|EndPosition=Offset%3D711%7CArticle%3DNKJV.EX.20%7COffsetInContext%3D10%7CContext%3Dandments.%2520%250A7%2520%25EF%25BB%25BFj%25EF%25BB%25BF%25E2%2580%259CYou%7CArticleLength%3D1895|Version=2012-11-01T17%3A13%3A53Z|StartPosition=Offset%3D664%7CArticle%3DNKJV.EX.20%7COffsetInContext%3D10%7CContext%3Dhousands%252C%2520to%2520those%2520w%7CArticleLength%3D1895|Resource=LLS%3A1.0.30|||||||||||0|
```

### Table: Labels

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Id | INTEGER | 0 |  | 1 |
| Name | TEXT | 1 |  | 0 |
| NoteSyncId | guid | 1 |  | 0 |


### Table: SyncInfo

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Key | TEXT | 1 |  | 1 |
| Value | TEXT | 0 |  | 0 |

**Sample Data (first 3 rows):**
```
Key|Value
ClientId|323ff8b6512347ab81d7beb5b8681d23
SyncContractVersion|3
ServerId|upgraded-from-sync-v1
```

### Table: DownloadedNotes

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| SyncId | guid | 1 |  | 1 |
| Revision | guid | 1 |  | 2 |
| CompressedJson | BLOB | 1 |  | 0 |


### Table: Notes

**Schema:**
```sql
```

**Column Information:**

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

**Sample Data (first 3 rows of 1048 total):**
```
Id|NotesDocumentId|CompressedUserTitle|CompressedContent|Rank|Level|Color|MarkupKind|MarkupStyleName|Tags|IndicatorKind|Created|Modified|SyncId|Revision|ImportId|IsSubmitted|Extra
1|1|||1000000000|0||4|Redeem||7|2012-04-06T14:45:32+08:00|2012-04-06T14:45:32+08:00|“v\™|èâíƒï€ˇ@ÉÈå¢^||1|
2|1|||2000000000|0||4|Redeem||7|2012-04-08T02:12:28+08:00|2012-04-08T02:12:28+08:00|,‹¸˙ Fó?cC¨¬˝w|Àvÿ®ŸIúÅG&I„q||1|
3|3|||1000000000|0|-1118720|0|||0|2012-11-20T23:06:08+00:00|2012-11-20T23:06:10+00:00|∑ØóÂƒÿM†t≈,˙v\»|´&øâ‘GÁC≥¯g ä¥||1|
```

### Table: SyncInfoVersion

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Version | INT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
Version
3
```

### Table: Info

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Version | INT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
Version
1037
```

### Table: NotesDocuments

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Id | INTEGER | 0 |  | 1 |
| DocumentId | TEXT | 1 |  | 0 |
| Title | TEXT | 0 |  | 0 |
| ImportId | TEXT | 0 |  | 0 |
| CreatedDate | TEXT | 0 |  | 0 |
| ModifiedDate | TEXT | 0 |  | 0 |
| SyncRevision | INTEGER | 0 |  | 0 |
| SyncState | INT | 0 |  | 0 |
| IsDeleted | INT | 0 |  | 0 |
| HasValidSortKeys | bool | 0 |  | 0 |

**Sample Data (first 3 rows):**
```
Id|DocumentId|Title|ImportId|CreatedDate|ModifiedDate|SyncRevision|SyncState|IsDeleted|HasValidSortKeys
1|Document:Notes:b742c31cd5c84fe2a28e9bccc8402e75|Inductive||2012-04-06T14:45:32+08:00|2012-04-08T02:12:28+08:00|1003568940|3|0|0
2|Document:Notes:7229dcecb6604add9ad965d789fce73c|People who love sin||2012-10-13T11:32:23+08:00|2012-10-13T11:36:41+08:00|1009786711|3|0|1
3|Document:Notes:bf2fe36ea9e244d9a0585d08e884bfc4|Bible Interpretation||2009-01-01T00:00:00+00:00|2012-11-20T23:06:10+00:00|1011675995|3|0|1
```

### Table: SyncItemsToPatch

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Id | TEXT | 1 |  | 1 |
| Revision | INTEGER | 1 |  | 0 |
| Data | BLOB | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
Id|Revision|Data
Document:Notes:b742c31cd5c84fe2a28e9bccc8402e75|1003568940|U
Document:Notes:7229dcecb6604add9ad965d789fce73c|1009786711|∫
Document:Notes:bf2fe36ea9e244d9a0585d08e884bfc4|1011675995|
```

### Table: LabelAttributeValues

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Id | INTEGER | 0 |  | 1 |
| LabelAttributeId | INTEGER | 1 |  | 0 |
| Value | TEXT | 1 |  | 0 |


### Table: Properties

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Key | TEXT | 1 |  | 0 |
| Value | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
Key|Value
CompareStringVersion|
```

### Table: LabelAttributes

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| Id | INTEGER | 0 |  | 1 |
| LabelId | INTEGER | 1 |  | 0 |
| Name | TEXT | 1 |  | 0 |
| Type | INTEGER | 1 |  | 0 |
| IsRequired | INTEGER | 1 | 0 | 0 |
| ValidValues | TEXT | 0 |  | 0 |


### Table: RenameOperations

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| OperationId | guid | 1 |  | 0 |
| OldStylePath | TEXT | 1 |  | 0 |
| NewStylePath | TEXT | 1 |  | 0 |
| OperationStatus | INT | 1 |  | 0 |


