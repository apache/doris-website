---
{
    "title": "FL_GET_BINARY",
    "language": "en",
    "description": "Return the binary contents stored in a FILE value."
}
---

## Description

Returns the binary contents stored in the `inline` field of a [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md) value. This function does not access the URI or download file contents.

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

FILE values obtained from TO_FILE or LIST_FILES currently have NULL `inline` fields, so FL_GET_BINARY returns NULL for those values.

## Examples

Use the resource and object from the [TO_FILE example](to-file.md):

```sql
SELECT FL_GET_BINARY(TO_FILE('file_test_s3_resource',
    's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg')) AS binary_value;
```

```text
binary_value
NULL
```

NULL input:

```sql
SELECT FL_GET_BINARY(NULL) AS binary_value;
```

```text
binary_value
NULL
```
