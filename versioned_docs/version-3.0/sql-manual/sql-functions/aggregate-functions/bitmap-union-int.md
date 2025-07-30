---
{
"title": "BITMAP-UNION-INT",
"language": "en"
}
---

## Description

Counts the number of distinct values in columns of type TINYINT, SMALLINT and INT. The return value is the same as COUNT(DISTINCT expr)

## Syntax

```sql
BITMAP_UNION_INT(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Supports columns or column expressions of type TINYINT, SMALLINT and INT |

## Return Value

Returns the number of distinct values in a column.

## Example

```sql
select dt,page,bitmap_to_string(user_id) from pv_bitmap;
```

```text
+------+------+---------------------------+
| dt   | page | bitmap_to_string(user_id) |
+------+------+---------------------------+
|    1 | 100  | 100,200,300               |
|    1 | 300  | 300                       |
|    2 | 200  | 300                       |
+------+------+---------------------------+
```

```sql
select bitmap_union_int(dt) from pv_bitmap;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    2 |
+----------------------+
```