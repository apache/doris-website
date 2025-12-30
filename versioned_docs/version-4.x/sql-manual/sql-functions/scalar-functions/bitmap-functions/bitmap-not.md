---
{
    "title": "BITMAP_NOT",
    "language": "en",
    "description": "Computes the difference between the first Bitmap and the second Bitmap, and returns the result as a new Bitmap."
}
---

## Description

Computes the difference between the first Bitmap and the second Bitmap, and returns the result as a new Bitmap.

## Syntax

```sql
BITMAP_NOT(<bitmap1>, <bitmap2>)
```

## Parameters

| Parameter   | Description          |
|-------------|----------------------|
| `<bitmap1>` | The first Bitmap     |
| `<bitmap2>` | The second Bitmap    |

## Return Value

A Bitmap representing the elements in `<bitmap1>` that are not in `<bitmap2>`.
- If the parameter has a NULL value, it returns NULL

## Examples

To compute the difference between two Bitmaps:

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) as res;
```

The result will be an empty Bitmap, as all elements in `<bitmap1>` are also in `<bitmap2>`:

```text
+------+
| res  |
+------+
|      |
+------+
```

To compute the difference where `<bitmap1>` has elements not present in `<bitmap2>`:

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) as res;
```

The result will be a Bitmap containing the element `5`:

```text
+------+
| res  |
+------+
| 5    |
+------+
```

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
