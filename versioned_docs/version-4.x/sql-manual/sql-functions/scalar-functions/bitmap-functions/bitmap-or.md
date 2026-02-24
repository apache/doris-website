---
{
    "title": "BITMAP_OR",
    "language": "en",
    "description": "Computes the union of two or more Bitmaps and returns a new Bitmap."
}
---

## Description

Computes the union of two or more Bitmaps and returns a new Bitmap.

## Syntax

```sql
BITMAP_OR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## Parameters

| Parameter   | Description    |
|-------------|----------------|
| `<bitmap1>` | The first Bitmap   |
| `<bitmap2>` | The second Bitmap  |
| ...         | ...            |
| `<bitmapN>` | The N-th Bitmap   |

## Return Value

A Bitmap that represents the union of multiple Bitmaps.

## Examples

To compute the union of two identical Bitmaps:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(1))) cnt;
```

The result will be:

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

To convert the union of two identical Bitmaps to a string:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) as res;
```

The result will be:

```text
+------+
| res  |
+------+
| 1    |
+------+
```

To compute the union of two different Bitmaps:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(2))) cnt;
```

The result will be:

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

To convert the union of two different Bitmaps to a string:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) res;
```

The result will be:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

To compute the union of multiple Bitmaps, including a `NULL` value:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL)) res;
```

The result will be:

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

To compute the union of multiple Bitmaps, including an empty Bitmap:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty())) res;
```

The result will be:

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

To compute the union of Bitmaps created from strings and individual values:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) res;
```

The result will be:

```text
+--------------+
| res          |
+--------------+
| 1,2,3,4,5,10 |
+--------------+
```
