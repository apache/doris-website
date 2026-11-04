---
{
    "title": "EXPLODE_FILE_OUTER",
    "language": "en",
    "description": "Expand FILE fields in a LATERAL VIEW."
}
---

## Description

Expands one FILE value into its six fields in a LATERAL VIEW. A NULL FILE produces one row containing six NULLs. This function expands metadata already stored in the value and does not access remote storage.

:::note
Since 4.2.0
:::

## Syntax

```sql
LATERAL VIEW EXPLODE_FILE_OUTER(<file>) <table_alias>
AS <uri>, <offset>, <size>, <content_type>, <checksum>, <inline>
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<file>` | Required FILE expression or NULL FILE. |
| `<table_alias>` | Alias for the expanded row. |
| Field aliases | Exactly six aliases, in the displayed order. |

## Return Value

Returns the following six nullable columns. A non-NULL FILE produces exactly one row, even when some or all metadata fields other than inline are NULL.

| Column | Type |
| --- | --- |
| uri | VARCHAR(65533) |
| offset | BIGINT |
| size | BIGINT |
| content_type | VARCHAR(1024) |
| checksum | VARCHAR(1024) |
| inline | VARBINARY |

## Example

Use the resource and object from the [TO_FILE example](../scalar-functions/to-file.md).

```sql
SELECT uri, size, HEX(CAST(inline_bytes AS STRING)) AS inline_hex
FROM (SELECT TO_FILE('file_test_s3_resource',
    's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg') AS f) t
LATERAL VIEW EXPLODE_FILE_OUTER(f) e AS uri, off, size, mime, checksum, inline_bytes;
```

```text
uri	size	inline_hex
s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg	158663	NULL
```

```sql
SELECT uri, size
FROM (SELECT CAST(NULL AS FILE) AS f) t
LATERAL VIEW EXPLODE_FILE_OUTER(f) e AS uri, off, size, mime, checksum, inline_bytes;
```

```text
+------+------+
| uri  | size |
+------+------+
| NULL | NULL |
+------+------+
```

See [EXPLODE_FILE](explode-file.md) for the other NULL-row behavior, and [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md) for field constraints.
