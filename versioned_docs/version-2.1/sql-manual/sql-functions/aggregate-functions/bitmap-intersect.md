---
{
    "title": "BITMAP_INTERSECT",
    "language": "en",
    "description": "Aggregation function, used to calculate the bitmap intersection after grouping. Common usage scenarios such as: calculating user retention rate."
}
---

## Description

Aggregation function, used to calculate the bitmap intersection after grouping. Common usage scenarios such as: calculating user retention rate.

## Syntax

```sql
BITMAP_INTERSECT(BITMAP <value>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<value>` | Supported bitmap data types |

## Return Value

The data type of the return value is BITMAP.

## Example

```sql
-- setup
CREATE TABLE user_tags (
	tag VARCHAR(20),
	date DATETIME,
	user_id BITMAP bitmap_union
) AGGREGATE KEY(tag, date) DISTRIBUTED BY HASH(tag) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO user_tags VALUES
	('A', '2020-05-18', to_bitmap(1)),
	('A', '2020-05-18', to_bitmap(2)),
	('A', '2020-05-19', to_bitmap(2)),
	('A', '2020-05-19', to_bitmap(3)),
	('B', '2020-05-18', to_bitmap(4)),
	('B', '2020-05-19', to_bitmap(4)),
	('B', '2020-05-19', to_bitmap(5));
```

Table schema

```
KeysType: AGG_KEY
Columns: tag varchar, date datetime, user_id bitmap bitmap_union
```

```
Find the retention of users between 2020-05-18 and 2020-05-19 under different tags.
mysql> select tag, bitmap_intersect(user_id) from (select tag, date, bitmap_union(user_id) user_id from table where date in ('2020-05-18', '2020-05-19') group by tag, date) a group by tag;
```

Used in combination with the bitmap_to_string function to obtain the specific data of the intersection

```
Who are the users retained under different tags between 2020-05-18 and 2020-05-19?
mysql> select tag, bitmap_to_string(bitmap_intersect(user_id)) from (select tag, date, bitmap_union(user_id) user_id from table where date in ('2020-05-18', '2020-05-19') group by tag, date) a group by tag;
```
