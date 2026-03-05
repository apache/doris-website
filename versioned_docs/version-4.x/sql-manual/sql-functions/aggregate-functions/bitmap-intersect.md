---
{
    "title": "BITMAP_INTERSECT",
    "language": "en",
    "description": "Used to calculate the intersection of grouped Bitmaps. Common use case: calculating user retention."
}
---

## Description

Used to calculate the intersection of grouped Bitmaps. Common use case: calculating user retention.

## Syntax

```sql
BITMAP_INTERSECT(BITMAP <value>)
```

## Arguments

| Argument | Description |
| -- | -- |
| `<value>` | Data type supporting Bitmap |

## Return Value

Returns a value of Bitmap type. If there is no valid data in the group, returns NULL.

## Example

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

```sql
select tag, bitmap_to_string(bitmap_intersect(user_id)) from (
	select tag, date, bitmap_union(user_id) user_id from user_tags where date in ('2020-05-18', '2020-05-19') group by tag, date
) a group by tag;
```

Query the user retention for different tags between today and yesterday.

```text
+------+---------------------------------------------+
| tag  | bitmap_to_string(bitmap_intersect(user_id)) |
+------+---------------------------------------------+
| A    | 2                                           |
| B    | 4                                           |
+------+---------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_intersect(user_id)) from user_tags where tag is null;
```

```text
+---------------------------------------------+
| bitmap_to_string(bitmap_intersect(user_id)) |
+---------------------------------------------+
|                                             |
+---------------------------------------------+
```
