---
{
    "title": "BITMAP_FROM_ARRAY",
    "language": "en"
}
---

## Description

Converts an array of TINYINT/SMALLINT/INT/BIGINT type to a BITMAP. When the input field is illegal, the result returns NULL.

## Syntax

```sql
BITMAP_FROM_ARRAY(<arr>)
```

## Parameters

| Parameter | Description   |
|-----------|---------------|
| `<arr>`   | integer array |

## Return Value

Returns a BITMAP
- When the input field is invalid, the result is NULL

## Examples

```sql
SELECT bitmap_to_string(bitmap_from_array(array(1, 0, 1, 1, 0, 1, 0))) AS bs;
```

```text
+------+
| bs   |
+------+
| 0,1  |
+------+
```