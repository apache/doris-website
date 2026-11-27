---
{
    "title": "EXPLODE_FILE_OUTER",
    "language": "en",
    "description": "Expand FILE fields in a LATERAL VIEW."
}
---

## Description

Expands one `FILE` value into its six fields in a `LATERAL VIEW`. A NULL `FILE` produces one row containing six `NULL`s. This function expands metadata already stored in the value and does not access remote storage.

## Syntax

```sql
LATERAL VIEW EXPLODE_FILE_OUTER(<file>) <table_alias>
AS <uri>, <offset>, <size>, <content_type>, <checksum>, <inline>
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<file>` | Required `FILE` expression or `NULL` (`FILE`). |
| `<table_alias>` | Alias for the expanded row. |
| Field aliases | Exactly six aliases, in the displayed order. |

## Return Value

Returns the following six nullable columns. A non-NULL `FILE` produces exactly one row, even when some or all fields are `NULL`.

| Column | Type |
| --- | --- |
| uri | STRING |
| offset | BIGINT |
| size | BIGINT |
| content_type | STRING |
| checksum | STRING |
| inline | VARBINARY |

## Example

Conceptual example assuming a data source provides a `FILE` column `f` (SQL `FILE` constructors and table columns are not yet enabled in the current release):

```sql
SELECT uri, size, HEX(CAST(inline_bytes AS STRING)) AS inline_hex
FROM file_source
LATERAL VIEW EXPLODE_FILE_OUTER(f) e AS uri, off, size, mime, checksum, inline_bytes;
```

```text
+-----------------------------+--------+------------+
| uri                         | size   | inline_hex |
+-----------------------------+--------+------------+
| s3://bucket/path/avatar.jpg | 158663 | NULL       |
+-----------------------------+--------+------------+
```

When `f` is `NULL`:

```sql
SELECT uri, size
FROM (SELECT IF(false, f, NULL) AS f FROM file_source) t
LATERAL VIEW EXPLODE_FILE_OUTER(f) e AS uri, off, size, mime, checksum, inline_bytes;
```

```text
+------+------+
| uri  | size |
+------+------+
| NULL | NULL |
+------+------+
```

See [EXPLODE_FILE](explode-file.md) for the other NULL-row behavior, and [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md) for field descriptions and constraints.
