---
{
"title": "GROUP_BITMAP_XOR",
"language": "en"
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
