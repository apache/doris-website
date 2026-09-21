---
{
    "title": "INT_TO_UUID",
    "language": "en",
    "description": "For the input encoded LARGEINT, converts it to the original UUID string."
}
---

## Description

For the input encoded LARGEINT, converts it to the original UUID string.

This function still returns a string. To migrate to the native [UUID type](../../../basic-element/sql-data-types/uuid.md), use `CAST(INT_TO_UUID(<int128>) AS UUID)`; direct casts between LARGEINT and UUID are unsupported.

## Syntax

```sql
INT_TO_UUID(<int128>)
```

## Parameters

| Parameter | Description |
|------------|-----------------|
| `<int128>` | Encoded LARGEINT value |

## Return Value

Returns the original UUID string of parameter `<int128>`.

- If input is NULL, returns NULL

## Examples

```sql
SELECT INT_TO_UUID(95721955514869408091759290071393952876)
```

```text
+-----------------------------------------------------+
| int_to_uuid(95721955514869408091759290071393952876) |
+-----------------------------------------------------+
| 6ce4766f-6783-4b30-b357-bba1c7600348                |
+-----------------------------------------------------+
```

```sql
SELECT INT_TO_UUID(NULL);
```

```text
+-------------------+
| INT_TO_UUID(NULL) |
+-------------------+
| NULL              |
+-------------------+
```
