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

The data type of the return value is BITMAP.

## Example

```sql
-- setup
create table pv_bitmap(id int, page varchar(10), user_id bitmap bitmap_union) aggregate key(id,page) distributed by hash(id) buckets 1 properties ("replication_num"="1");
insert into pv_bitmap values (1,'m',bitmap_from_string('4,7,8')),(2,'m',bitmap_from_string('1,3,6,15')),(3,'m',bitmap_from_string('4,7'));
```

```sql
 select page, bitmap_to_string(user_id) from pv_bitmap;
```

```text
+------+-----------------------------+
| page | bitmap_to_string(`user_id`) |
+------+-----------------------------+
| m    | 4,7,8                       |
| m    | 1,3,6,15                    |
| m    | 4,7                         |
+------+-----------------------------+
```

```sql
select page, bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap group by page;
```

```text
+------+-----------------------------------------------+
| page | bitmap_to_string(group_bitmap_xor(`user_id`)) |
+------+-----------------------------------------------+
| m    | 1,3,6,8,15                                    |
+------+-----------------------------------------------+
```
