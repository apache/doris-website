---
{
    "title": "BITMAP_UNION",
    "language": "en",
    "description": "Calculates the union of input Bitmaps and returns a new Bitmap."
}
---

## Description

Calculates the union of input Bitmaps and returns a new Bitmap.

## Syntax

```sql
BITMAP_UNION(<expr>)
```

## Arguments

| Argument | Description |
| -- | -- |
| `<expr>` | Data type supporting Bitmap |

## Return Value

Returns a value of Bitmap type. If there is no valid data in the group, returns an empty Bitmap.

## Example

```sql
-- setup
CREATE TABLE pv_bitmap (
  dt INT,
  page INT,
  user_id BITMAP
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
  (1, 100, to_bitmap(100)),
  (1, 100, to_bitmap(200)),
  (1, 100, to_bitmap(300)),
  (2, 200, to_bitmap(300));
```

```sql
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap;
```

```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
| 100,200,300                             |
+-----------------------------------------+
```

```sql
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap where user_id is null;
```

```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
|                                         |
+-----------------------------------------+
```
