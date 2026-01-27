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

## Examples

```sql
mysql> select bitmap_has_any(to_bitmap(1), to_bitmap(2));
```

```text
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(2)) |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+
```

```sql
mysql> select bitmap_has_any(to_bitmap(1), to_bitmap(1));
```

```text
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(1)) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```
