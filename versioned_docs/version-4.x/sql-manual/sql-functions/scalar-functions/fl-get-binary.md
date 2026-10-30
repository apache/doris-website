---
{
    "title": "FL_GET_BINARY",
    "language": "en",
    "description": "Return the binary contents stored in a FILE value."
}
---

## Description

Returns the binary contents stored in the `inline` field of a [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md) value. This function does not access the URI or download file contents.

:::note
Since 4.2
:::

## Syntax

```sql
FL_GET_BINARY(<file>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<file>` | A FILE expression or NULL. Other argument types produce an error. |

## Return Value

The return type is nullable `VARBINARY`. A NULL FILE or NULL `inline` field returns NULL. Empty binary contents remain empty. The stored bytes are returned unchanged; `offset` and `size` do not select a range within them.

## Examples

Read stored binary contents. `FROM_BINARY` displays the result as hexadecimal text.

```sql
SELECT FROM_BINARY(FL_GET_BINARY(CAST(NAMED_STRUCT(
    'uri', 's3://bucket/a.png', 'offset', CAST(2 AS BIGINT), 'size', CAST(3 AS BIGINT),
    'content_type', 'image/png', 'checksum', NULL, 'inline', X'00FF80'
) AS FILE))) AS binary_hex;
```

```text
binary_hex
00FF80
```

NULL input:

```sql
SELECT FL_GET_BINARY(NULL) AS binary_value;
```

```text
binary_value
NULL
```

A FILE with a URI and no stored binary contents:

```sql
SELECT FL_GET_BINARY(CAST(NAMED_STRUCT(
    'uri', 's3://bucket/a.png', 'offset', NULL, 'size', NULL,
    'content_type', NULL, 'checksum', NULL, 'inline', NULL
) AS FILE)) AS binary_value;
```

```text
binary_value
NULL
```

Empty binary contents:

```sql
SELECT FROM_BINARY(FL_GET_BINARY(CAST(NAMED_STRUCT(
    'uri', NULL, 'offset', NULL, 'size', NULL,
    'content_type', NULL, 'checksum', NULL, 'inline', CAST(UNHEX('') AS VARBINARY)
) AS FILE))) = '' AS is_empty;
```

```text
is_empty
1
```
