---
{
    "title": "BITMAP_INTERSECT",
    "language": "zh-CN",
    "description": "用于计算分组后的 Bitmap 交集。常见使用场景如：计算用户留存率。"
}
---

## 描述

用于计算分组后的 Bitmap 交集。常见使用场景如：计算用户留存率。

## 语法

```sql
BITMAP_INTERSECT(BITMAP <value>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<value>` | 支持 Bitmap 的数据类型 |

## 返回值

返回值的数据类型为 Bitmap。
组内没有合法数据时，返回 NULL。

## 举例

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

查询今天和昨天不同 tag 下的用户留存。

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