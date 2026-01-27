---
{
    "title": "GROUP_BITMAP_XOR",
    "language": "en",
    "description": "Mainly used to merge the values of multiple bitmaps and perform bitwise xor calculations on the results."
}
---

## Description

Mainly used to merge the values of multiple bitmaps and perform bitwise xor calculations on the results.

## Syntax

```sql
GROUP_BITMAP_XOR(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Supported bitmap data types |

## Return Value

The data type of the return value is BITMAP. If there is no valid data in the group, returns NULL.

## Example

```sql
-- setup
CREATE TABLE pv_bitmap (
	page varchar(10),
	user_id BITMAP
) DISTRIBUTED BY HASH(page) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	('m', to_bitmap(4)),
	('m', to_bitmap(7)),
	('m', to_bitmap(8)),
	('m', to_bitmap(1)),
	('m', to_bitmap(3)),
	('m', to_bitmap(6)),
	('m', to_bitmap(15)),
	('m', to_bitmap(4)),
	('m', to_bitmap(7));
```

```sql
select page, bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap group by page;
```

```text
+------+---------------------------------------------+
| page | bitmap_to_string(group_bitmap_xor(user_id)) |
+------+---------------------------------------------+
| m    | 1,3,6,8,15                                  |
+------+---------------------------------------------+
```

```sql
select bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap where page is null;
```

```text
+---------------------------------------------+
| bitmap_to_string(group_bitmap_xor(user_id)) |
+---------------------------------------------+
| NULL                                        |
+---------------------------------------------+
```
