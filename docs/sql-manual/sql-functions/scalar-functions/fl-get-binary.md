---
{
    "title": "FL_GET_BINARY",
    "language": "en",
    "description": "Return the binary contents stored in a FILE value."
}
---

## Description

Returns the binary contents stored in the `inline` field of a [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md) value. This function does not access the URI or download remote file contents.

## Syntax

```sql
FL_GET_BINARY(<file>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<file>` | A `FILE` expression or `NULL`. Other argument types produce an error. |

## Return Value

The return type is nullable `VARBINARY`. A `NULL` `FILE` or `NULL` `inline` field returns `NULL`. Empty binary contents remain empty. The stored bytes are returned unchanged; `offset` and `size` do not select a range within them.

## Example

`NULL` input:

```sql
SELECT FL_GET_BINARY(NULL) AS binary_value;
```

```text
+--------------+
| binary_value |
+--------------+
| NULL         |
+--------------+
```

Conceptual usage when reading from a data source that provides a `FILE` column `f` (SQL `FILE` constructors and table columns are not yet enabled in the current release):

```sql
SELECT FROM_BINARY(FL_GET_BINARY(f)) AS inline_hex
FROM file_source;
```

```text
+------------+
| inline_hex |
+------------+
| 00FF80     |
+------------+
```
