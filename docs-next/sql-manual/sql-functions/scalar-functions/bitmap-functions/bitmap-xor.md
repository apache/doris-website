---
{
    "title": "BITMAP_XOR",
    "language": "en",
    "description": "Computes the symmetric difference (XOR operation) of two or more input Bitmaps and returns a new Bitmap."
}
---

## Description

Computes the symmetric difference (XOR operation) of two or more input Bitmaps and returns a new Bitmap.

## Syntax

```sql
BITMAP_XOR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## Parameters

| Parameter   | Description       |
|-------------|-------------------|
| `<bitmap1>` | The first Bitmap  |
| `<bitmap2>` | The second Bitmap |
| ...         | ...               |
| `<bitmapN>` | The N-th Bitmap   |

## Return Value

A Bitmap representing the symmetric difference of multiple Bitmaps.
- If the parameter has a NULL value, it returns NULL

## Examples

To compute the symmetric difference of two Bitmaps:

```sql
select bitmap_count(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) cnt;
```

The result will be:

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

To convert the symmetric difference of two Bitmaps to a string:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) res;
```

The result will be:

```text
+------+
| res  |
+------+
| 1,4  |
+------+
```

To compute the symmetric difference of three Bitmaps:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'))) res;
```

The result will be:

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

To compute the symmetric difference of multiple Bitmaps, including an empty Bitmap:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty())) res;
```

The result will be:

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

To compute the symmetric difference of multiple Bitmaps, including a `NULL` value:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL)) res;
```

The result will be:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
