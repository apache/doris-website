---
{
    "title": "SUB_BITMAP",
    "language": "en"
}
---

## Description

Extracts a subset of Bitmap elements starting from a specified position and limited by a specified cardinality limit, returning the subset as a new Bitmap.

## Syntax

```sql
SUB_BITMAP(<bitmap>, <position>, <cardinality_limit>)
```

## Parameters

| Parameter             | Description                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | The Bitmap value              |
| `<position>`          | The starting position (inclusive),If the index is negative, the last element is -1. |
| `<cardinality_limit>` | The maximum number of elements |

## Return Value

A subset Bitmap within the specified range and limit.
- If the parameter is NULL, returns NULL


## Examples

To get a subset of a Bitmap starting from position 0 with a cardinality limit of 3:

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| 0,1,2 |
+-------+
```

To get a subset of a Bitmap starting from position -3 with a cardinality limit of 2:

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| 2,3   |
+-------+
```

To get a subset of a Bitmap starting from position 2 with a cardinality limit of 100:

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, NULL)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
