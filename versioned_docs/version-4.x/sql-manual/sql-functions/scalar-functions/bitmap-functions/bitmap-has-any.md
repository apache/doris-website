---
{
    "title": "BITMAP_HAS_ANY",
    "language": "en",
    "description": "Determines whether two Bitmaps share any common elements."
}
---

## Description

Determines whether two Bitmaps share any common elements.

## Syntax

```sql
BITMAP_HAS_ANY(<bitmap1>, <bitmap2>)
```

## Parameters

| Parameter   | Description          |
|-------------|----------------------|
| `<bitmap1>` | The first Bitmap     |
| `<bitmap2>` | The second Bitmap    |

## Return Value

Returns true if the two Bitmaps have any common elements;  
Returns false if the two Bitmaps do not have any common elements.
- If the parameter has a NULL value, it returns NULL

## Examples

```sql
select bitmap_has_any(to_bitmap(1), to_bitmap(2)) res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), to_bitmap(1)) res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), NULL) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
