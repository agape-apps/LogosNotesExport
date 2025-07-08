# NotesTool Database Analysis Report
Generated: Tue Jul  8 20:02:09 PST 2025

## Database Information
- **Path:** `./LogosDocuments/NotesToolManager/notestool.db`
- **Size:** 2.9M

## Tables Overview

| Table Name | Row Count |
|------------|-----------|
| BibleDataTypeInfo | 1 |
| NoteTags | 0 |
| DataTypes | 9 |
| Notebooks | 72 |
| GuideSections | 1 |
| Notes | 2042 |
| Info | 1 |
| ResourceIds | 52 |
| InputIds | 0 |
| ResourceVersions | 69 |
| Languages | 0 |
| SyncItems | 7711 |
| NeedsAnchorUpdateNotes | 0 |
| SyncProperties | 4 |
| NoteAnchorFacetReferences | 1701 |
| SyncUploads | 0 |
| NoteAnchorHeadwords | 0 |
| SyncingNotebooks | 0 |
| NoteAnchorReferences | 257 |
| SyncingNotes | 0 |
| NoteAnchorTextRanges | 1916 |
| Tags | 0 |
| NoteColors | 9 |
| WorkflowKeys | 0 |
| NoteIndicators | 5 |
| WorkflowTemplateIds | 0 |
| NoteStyles | 25 |

## Detailed Table Schemas

### Table: BibleDataTypeInfo

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| BibleDataTypeNames | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
BibleDataTypeNames
bible+nkjv;bible+esv;bible+nlt;bible+kjv;bible+leb2;bible;bible+csb2;bible+cambridge1895
```

### Table: NoteTags

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteId | INTEGER | 1 |  | 0 |
| TagId | INT | 1 |  | 0 |


### Table: DataTypes

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| DataTypeId | INTEGER | 0 |  | 1 |
| Name | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
DataTypeId|Name
1|bible
2|bible+nkjv
3|bible+nrsv
```

### Table: Notebooks

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NotebookId | INTEGER | 0 |  | 1 |
| ExternalId | TEXT | 1 |  | 0 |
| RevisionToken | TEXT | 0 |  | 0 |
| CreatedDate | TEXT | 1 |  | 0 |
| ModifiedDate | TEXT | 0 |  | 0 |
| CreatedBy | TEXT | 0 |  | 0 |
| ModifiedBy | TEXT | 0 |  | 0 |
| IsDeleted | bool | 1 | 0 | 0 |
| IsTrashed | bool | 1 | 0 | 0 |
| IsSyncing | bool | 1 | 0 | 0 |
| Title | TEXT | 0 |  | 0 |
| ImportId | TEXT | 0 |  | 0 |
| Role | INT | 1 | 1 | 0 |

**Sample Data (first 3 rows):**
```
NotebookId|ExternalId|RevisionToken|CreatedDate|ModifiedDate|CreatedBy|ModifiedBy|IsDeleted|IsTrashed|IsSyncing|Title|ImportId|Role
1|b0c6a441a97c431d86bba170623ec9ea|af15abdd595f4dc89bf4d08fc3b7f39b|2009-01-01T00:00:00Z|2024-09-14T10:33:44Z|||0|0|0|Missions 1|rev=76316827|1
2|0b1c7d3e264948aa94e091e0b1628889|a9a5d4ddd744494eba68aba1ce60fa20|2009-01-01T00:00:00Z|2016-04-06T21:35:33Z|||0|0|0|Adelas Notes 1|rev=1026353998|1
3|37cd6552cb4641c0940e3663709beb09|7e72fd1934af4b71a342d5940f22dd74|2009-01-01T00:00:00Z|2017-05-21T03:48:16Z|||0|0|0|Forgiven|rev=84962610|1
```

### Table: GuideSections

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| GuideSectionId | INTEGER | 0 |  | 1 |
| GuideSection | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
GuideSectionId|GuideSection
1|OriginalLanguageTranslation
```

### Table: Notes

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteId | INTEGER | 0 |  | 1 |
| ExternalId | TEXT | 1 |  | 0 |
| RevisionToken | TEXT | 0 |  | 0 |
| ImportId | TEXT | 0 |  | 0 |
| CreatedDate | TEXT | 1 |  | 0 |
| ModifiedDate | TEXT | 0 |  | 0 |
| CreatedBy | TEXT | 0 |  | 0 |
| ModifiedBy | TEXT | 0 |  | 0 |
| IsDeleted | bool | 1 | 0 | 0 |
| IsTrashed | bool | 1 | 0 | 0 |
| IsSyncing | bool | 1 | 0 | 0 |
| Kind | INT | 1 |  | 0 |
| ContentRichText | TEXT | 0 |  | 0 |
| FoldedContent | TEXT | 0 |  | 0 |
| NoteIndicatorId | INT | 0 |  | 0 |
| NoteColorId | INT | 0 |  | 0 |
| NoteStyleId | INT | 0 |  | 0 |
| AnchorsJson | TEXT | 0 |  | 0 |
| AnchorDataTypeId | INT | 0 |  | 0 |
| AnchorLanguageId | INT | 0 |  | 0 |
| AnchorResourceIdId | INT | 0 |  | 0 |
| AnchorBibleBook | INT | 0 |  | 0 |
| AnchorWorkflowTemplateIdId | INT | 0 |  | 0 |
| AnchorWorkflowKeyId | INT | 0 |  | 0 |
| AnchorGuideSectionId | INT | 0 |  | 0 |
| AnchorInputIdId | INT | 0 |  | 0 |
| TagsJson | TEXT | 0 |  | 0 |
| NotebookExternalId | TEXT | 1 |  | 0 |
| Rank | INTEGER | 1 | 0 | 0 |
| Indent | INT | 1 | 0 | 0 |
| LabelsJson | TEXT | 0 |  | 0 |
| ClippingTitleRichText | TEXT | 0 |  | 0 |
| ClippingExcerptRichText | TEXT | 0 |  | 0 |
| Role | INT | 1 | 1 | 0 |

**Sample Data (first 3 rows of 2042 total):**
```
NoteId|ExternalId|RevisionToken|ImportId|CreatedDate|ModifiedDate|CreatedBy|ModifiedBy|IsDeleted|IsTrashed|IsSyncing|Kind|ContentRichText|FoldedContent|NoteIndicatorId|NoteColorId|NoteStyleId|AnchorsJson|AnchorDataTypeId|AnchorLanguageId|AnchorResourceIdId|AnchorBibleBook|AnchorWorkflowTemplateIdId|AnchorWorkflowKeyId|AnchorGuideSectionId|AnchorInputIdId|TagsJson|NotebookExternalId|Rank|Indent|LabelsJson|ClippingTitleRichText|ClippingExcerptRichText|Role
1|4df5fc098a9e4739a9478bf7b724320a|df81590932f34757a724d91d1348ed0e||2017-09-17T01:17:20Z|2017-09-17T01:17:20Z|||0|0|0|1|||1|1|1|[{"textRange":{"resourceId":"LLS:1.0.171","version":"2017-06-29T21:10:01Z","offset":2846016,"length":409}}]|1||1|23|||||||0|0||||1
2|aa6a07b9b23a441192bfb62e5e0456a1|0a4f762000f64beeb06d3b1ee31c663b||2017-09-17T07:03:35Z|2017-09-17T07:03:35Z|||0|0|0|1|||1|1|1|[{"textRange":{"resourceId":"LLS:1.0.30","version":"2016-12-08T21:30:09Z","offset":3478855,"length":495}}]|1||2|23|||||||0|0||||1
3|dd23df21fdab4f99b3d4659acba49e78|c59f5bf4261d42bb869651ce1fbdd200|rev=cd3b044041bc4e67a671a102b73be333|2011-06-04T10:27:31Z|2016-04-06T21:35:33Z|||0|0|0|0|<Paragraph NamedStyle="OldTitle"><Run Language="en-US" FontItalic="True" Text="And when He " /><Run FontItalic="True" Text="‚Ä¶ " /><Run Language="en-US" FontItalic="True" Text="world of sin" /></Paragraph><Paragraph Language="en-US" FontFamily="Athelas Logos" FontSize="12"><Run Text="who does he convict?" /></Paragraph>| and when he world of sin who does he convict|2|1|1|[{"textRange":{"resourceId":"LLS:1.0.30","version":"2016-05-17T23:00:37Z","offset":4640152,"length":56}}]|1||2|64||||||0b1c7d3e264948aa94e091e0b1628889|1000000000|0||||1
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
35
```

### Table: ResourceIds

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| ResourceIdId | INTEGER | 0 |  | 1 |
| ResourceId | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
ResourceIdId|ResourceId
1|LLS:1.0.171
2|LLS:1.0.30
3|LLS:1.0.710
```

### Table: InputIds

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| InputIdId | INTEGER | 0 |  | 1 |
| InputId | TEXT | 1 |  | 0 |


### Table: ResourceVersions

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| ResourceVersionId | INTEGER | 0 |  | 1 |
| ResourceId | TEXT | 1 |  | 0 |
| Version | TEXT | 1 |  | 0 |
| IsCurrent | bool | 1 | 0 | 0 |

**Sample Data (first 3 rows):**
```
ResourceVersionId|ResourceId|Version|IsCurrent
1|LLS:1.0.171|1970-01-01T00:00:00Z|0
2|LLS:1.0.30|1970-01-01T00:00:00Z|0
3|LLS:1.0.710|2019-04-30T20:46:24Z|1
```

### Table: Languages

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| LanguageId | INTEGER | 0 |  | 1 |
| Name | TEXT | 1 |  | 0 |


### Table: SyncItems

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| SyncItemId | INTEGER | 0 |  | 1 |
| NoteId | INTEGER | 0 |  | 0 |
| NotebookId | INTEGER | 0 |  | 0 |
| Kind | INT | 1 |  | 0 |
| SyncDocId | TEXT | 0 |  | 0 |
| LastUploadId | TEXT | 0 |  | 0 |
| IsDeleted | bool | 1 | 0 | 0 |
| RevisionNumber | INTEGER | 0 |  | 0 |
| Epoch | INT | 0 |  | 0 |
| LastEditorId | INT | 0 |  | 0 |
| SyncState | INT | 1 | 0 | 0 |
| ModifiedUtc | TEXT | 0 |  | 0 |
| ExtraJson | TEXT | 0 |  | 0 |

**Sample Data (first 3 rows of 7711 total):**
```
SyncItemId|NoteId|NotebookId|Kind|SyncDocId|LastUploadId|IsDeleted|RevisionNumber|Epoch|LastEditorId|SyncState|ModifiedUtc|ExtraJson
1|1||0|6646||0|1|1||4|2017-09-17T01:17:20Z|
2|2||0|6654||0|1|1||4|2017-09-17T07:03:35Z|
3|3||0|9471543||0|1|11||4|2016-04-06T21:35:33Z|
```

### Table: NeedsAnchorUpdateNotes

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteId | INTEGER | 0 |  | 1 |
| RefCount | INT | 1 |  | 0 |


### Table: SyncProperties

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| SyncPropertyId | INTEGER | 0 |  | 1 |
| Key | TEXT | 1 |  | 0 |
| Value | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
SyncPropertyId|Key|Value
1|ClientId|5dbc24ff59534988ae2644a086fd1f12
2|ServerId|initial
3|Milestone|djI6MzkxNDQ5NTcyNyw0NjQzNTAzODc
```

### Table: NoteAnchorFacetReferences

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteAnchorFacetReferenceId | INTEGER | 0 |  | 1 |
| NoteId | INTEGER | 1 |  | 0 |
| AnchorIndex | INT | 1 |  | 0 |
| DataTypeId | INT | 1 |  | 0 |
| BibleBook | INT | 0 |  | 0 |
| SortKey | BLOB | 1 |  | 0 |
| Reference | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows of 1701 total):**
```
NoteAnchorFacetReferenceId|NoteId|AnchorIndex|DataTypeId|BibleBook|SortKey|Reference
1|6|0|1|19|∞'Uêê|bible+esv.19.86.9
2|116|0|1|62|∞SBR†|bible+nkjv.62.9.42
3|120|0|1|64|∞W@—|bible+nkjv.64.3.16
```

### Table: SyncUploads

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| SyncUploadId | INTEGER | 0 |  | 1 |
| UploadId | TEXT | 1 |  | 0 |
| UtcDateTime | TEXT | 1 |  | 0 |


### Table: NoteAnchorHeadwords

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteAnchorHeadwordId | INTEGER | 0 |  | 1 |
| LanguageId | INT | 1 |  | 0 |
| FoldedHeadword | TEXT | 1 |  | 0 |
| NoteId | INTEGER | 1 |  | 0 |
| AnchorIndex | INT | 1 |  | 0 |


### Table: SyncingNotebooks

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NotebookId | INTEGER | 1 |  | 0 |


### Table: NoteAnchorReferences

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteAnchorReferenceId | INTEGER | 0 |  | 1 |
| DataTypeId | INT | 1 |  | 0 |
| StartSortKey | BLOB | 1 |  | 0 |
| PastEndSortKey | BLOB | 1 |  | 0 |
| NoteId | INTEGER | 1 |  | 0 |
| AnchorIndex | INT | 1 |  | 0 |

**Sample Data (first 3 rows of 257 total):**
```
NoteAnchorReferenceId|DataTypeId|StartSortKey|PastEndSortKey|NoteId|AnchorIndex
1|2|SBR†|SBR®|116|0
2|3|wBR†|wBR®|116|0
3|2|W@—|W@—|120|0
```

### Table: SyncingNotes

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteId | INTEGER | 1 |  | 0 |


### Table: NoteAnchorTextRanges

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteAnchorTextRangeId | INTEGER | 0 |  | 1 |
| ResourceIdId | INT | 1 |  | 0 |
| ResourceVersionId | INTEGER | 1 |  | 0 |
| Offset | INT | 1 |  | 0 |
| PastEnd | INT | 1 |  | 0 |
| NoteId | INTEGER | 1 |  | 0 |
| AnchorIndex | INT | 1 |  | 0 |
| WordNumberCount | INT | 1 | -1 | 0 |
| WordNumbers | BLOB | 0 |  | 0 |

**Sample Data (first 3 rows of 1916 total):**
```
NoteAnchorTextRangeId|ResourceIdId|ResourceVersionId|Offset|PastEnd|NoteId|AnchorIndex|WordNumberCount|WordNumbers
6|3|3|3229953|3230062|6|0|17|
hot/235253
hot/235254
hot/235255
hot/235256
hot/235257hot/235258:1hot/235258:2hot/235259:1hot/235259:2:1hot/235259:2:2
hot/235260hot/235259.2hot/235261:1hot/235261:2hot/235262:1hot/235262:2:2hot/235262:2:1
34|5|5|-1|-1|34|0|-1|
66|9|9|-1|-1|66|0|-1|
```

### Table: Tags

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| TagId | INTEGER | 0 |  | 1 |
| Text | TEXT | 1 |  | 0 |
| FoldedText | TEXT | 1 |  | 0 |


### Table: NoteColors

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteColorId | INTEGER | 0 |  | 1 |
| Name | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
NoteColorId|Name
1|yellow
2|violet
3|red
```

### Table: WorkflowKeys

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| WorkflowKeyId | INTEGER | 0 |  | 1 |
| WorkflowKey | TEXT | 1 |  | 0 |


### Table: NoteIndicators

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteIndicatorId | INTEGER | 0 |  | 1 |
| Name | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
NoteIndicatorId|Name
1|hidden
2|box
3|exclamation
```

### Table: WorkflowTemplateIds

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| WorkflowTemplateIdId | INTEGER | 0 |  | 1 |
| WorkflowTemplateId | TEXT | 1 |  | 0 |


### Table: NoteStyles

**Schema:**
```sql
```

**Column Information:**

| Column | Type | Not Null | Default | Primary Key |
|--------|------|----------|---------|-------------|
| NoteStyleId | INTEGER | 0 |  | 1 |
| Name | TEXT | 1 |  | 0 |

**Sample Data (first 3 rows):**
```
NoteStyleId|Name
1|highlight
2|custom:GreenHighlighter
3|custom:YellowHighlighter
```

