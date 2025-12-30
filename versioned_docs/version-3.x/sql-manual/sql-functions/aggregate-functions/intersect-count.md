---
{
    "title": "INTERSECT_COUNT",
    "language": "en",
    "description": "The INTERSECTCOUNT function is used to calculate the number of intersecting elements of the Bitmap data structure."
}
---

## Description

The INTERSECT_COUNT function is used to calculate the number of intersecting elements of the Bitmap data structure.

## Syntax

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<bitmap_column>` | The expression that needs to be obtained. |
| `<column_to_filter>` | Optional. The dimension column that needs to be filtered. |
| `<filter_values>` | Optional. Different values of the filtering dimension column. |

## Return Value

Returns a value of type BIGINT.

## Example

```sql
select dt,bitmap_to_string(user_id) from pv_bitmap where dt in (3,4);
```

```text
+------+-----------------------------+
| dt   | bitmap_to_string(`user_id`) |
+------+-----------------------------+
| 4    | 1,2,3                       |
| 3    | 1,2,3,4,5                   |
+------+-----------------------------+
```

```sql
select intersect_count(user_id,dt,3,4) from pv_bitmap;
```

```text
+----------------------------------------+
| intersect_count(`user_id`, `dt`, 3, 4) |
+----------------------------------------+
|                                      3 |
+----------------------------------------+
```
