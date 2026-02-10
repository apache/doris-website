---
{
    "title": "BITMAP_UNION_COUNT",
    "language": "en",
    "description": "Calculates the union of input Bitmaps and returns its cardinality."
}
---

## Description

Calculates the union of input Bitmaps and returns its cardinality.

## Syntax

```sql
BITMAP_UNION_COUNT(<expr>)
```

## Arguments

| Argument | Description |
| -- | -- |
| `<expr>` | Data type supporting Bitmap |

## Return Value

Returns the size of the Bitmap union, i.e., the number of distinct elements. If there is no valid data in the group, returns 0.

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
select bitmap_union_count(user_id) from pv_bitmap;
```

Counts the number of distinct user_id values.

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           3 |
+-----------------------------+
```

```sql
select bitmap_union_count(user_id) from pv_bitmap where user_id is null;
```

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           0 |
+-----------------------------+
```
