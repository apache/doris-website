---
{
"title": "BITMAP_UNION_COUNT",
"language": "en"
}
---

## Description

Computes the union of input Bitmaps and returns their cardinality.

## Syntax

```sql
BITMAP_UNION_COUNT(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Supported data types of BITMAP |

## Return Value

Returns the size of the Bitmap union, that is, the number of elements after deduplication

## Example

```sql
select dt,page,bitmap_to_string(user_id) from pv_bitmap;
```

```text
+------+------+---------------------------+
| dt   | page | bitmap_to_string(user_id) |
+------+------+---------------------------+
|    1 | 100  | 100,200,300               |
|    2 | 200  | 300                       |
+------+------+---------------------------+
```

Calculate the deduplication value of user_id:

```
select bitmap_union_count(user_id) from pv_bitmap;
```

```text
+-------------------------------------+
| bitmap_count(bitmap_union(user_id)) |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```
