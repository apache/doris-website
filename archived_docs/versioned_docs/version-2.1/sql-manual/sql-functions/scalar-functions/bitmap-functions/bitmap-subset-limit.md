---
{
    "title": "BITMAP_SUBSET_LIMIT",
    "language": "en",
    "description": "Extracts a subset of Bitmap elements starting from a specified position, with a limit on the number of elements specified by the cardinality limit,"
}
---

## Description

Extracts a subset of Bitmap elements starting from a specified position, with a limit on the number of elements specified by the cardinality limit, and returns the subset as a new Bitmap.

## Syntax

```sql
BITMAP_SUBSET_LIMIT(<bitmap>, <position>, <cardinality_limit>)
```

## Parameters

| Parameter             | Description                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | The Bitmap value              |
| `<position>`          | The starting position (inclusive) |
| `<cardinality_limit>` | The maximum number of elements |

## Return Value

A subset Bitmap within the specified range and limit.

## Examples

To get a subset of a Bitmap starting from position 0 with a cardinality limit of 3:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
```

The result will be:

```text
+-----------+
| value     |
+-----------+
| 1,2,3     |
+-----------+
```

To get a subset of a Bitmap starting from position 4 with a cardinality limit of 3:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| 4,5   |
+-------+
```
