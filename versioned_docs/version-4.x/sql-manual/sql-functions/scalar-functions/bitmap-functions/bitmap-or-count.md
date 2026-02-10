---
{
    "title": "BITMAP_OR_COUNT",
    "language": "en",
    "description": "Computes the union of two or more input Bitmaps and returns the count of elements in the union."
}
---

## Description

Computes the union of two or more input Bitmaps and returns the count of elements in the union.

## Syntax

```sql
BITMAP_OR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## Parameters

| Parameter   | Description    |
|-------------|----------------|
| `<bitmap1>` | The first Bitmap   |
| `<bitmap2>` | The second Bitmap  |
| ...         | ...            |
| `<bitmapN>` | The N-th Bitmap   |

## Return Value

The count of elements in the union of multiple Bitmaps.  

## Examples

To compute the count of elements in the union of a non-empty Bitmap and an empty Bitmap:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty()) res;
```

The result will be:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

To compute the count of elements in the union of two identical Bitmaps:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

The result will be:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

To compute the count of elements in the union of two different Bitmaps:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

The result will be:

```text
+------+
| res  |
+------+
|    5 |
+------+
```

To compute the count of elements in the union of multiple Bitmaps, including an empty Bitmap:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty()) res;
```

The result will be:

```text
+------+
| res  |
+------+
|    6 |
+------+
```

To compute the count of elements in the union of multiple Bitmaps, including a `NULL` value:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL) res;
```

The result will be:

```text
+------+
| res  |
+------+
|    6 |
+------+
```
