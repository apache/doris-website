---
{
"title": "INTERSECT_COUNT",
"language": "en"
}
---

## Description

Calculate the intersection of two or more bitmaps
Usage: intersect_count(bitmap_column_to_count, filter_column, filter_values ...)
Example: intersect_count(user_id, event, 'A', 'B', 'C'), meaning find the intersect count of user_id in all A/B/C 3 bitmaps
Calculate the intersection count of elements in bitmap_column that match column_to_filter within filter_values, i.e., bitmap intersection count.

## Syntax

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values> [, ...])
```

## Parameters  

| Parameter         | Description                                      |
|------------------|--------------------------------------------------|
| `<bitmap_column>`  | The input bitmap parameter column. Supported types: Bitmap. |
| `<column_to_filter>` | The dimension column used for filtering. Supported types: TinyInt, SmallInt, Integer, BigInt, LargeInt. |
| `<filter_values>`  | The different values used to filter the dimension column. Supported types: TinyInt, SmallInt, Integer, BigInt, LargeInt. |


## Return Value  

Returns the number of elements in the intersection of the given bitmaps.

## Example

```sql
-- setup
CREATE TABLE pv_bitmap (
	dt INT,
	user_id BITMAP,
	city STRING
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	(20250801, to_bitmap(1), 'beijing'),
	(20250801, to_bitmap(2), 'beijing'),
	(20250801, to_bitmap(3), 'shanghai'),
	(20250802, to_bitmap(3), 'beijing'),
	(20250802, to_bitmap(4), 'shanghai'),
	(20250802, to_bitmap(5), 'shenzhen');
```

```sql
select intersect_count(user_id,dt,20250801) from pv_bitmap;
```

```text
+--------------------------------------+
| intersect_count(user_id,dt,20250801) |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```
