---
{
    "title": "BITMAP_INTERSECT",
    "language": "ja",
    "description": "グループ化された Bitmap の積集合を計算します。一般的な用途はユーザーの継続利用状況の算出です。"
}
---

## 説明

グループ化された Bitmap の積集合を計算します。一般的な用途はユーザーの継続利用状況の算出です。

## 構文

```sql
BITMAP_INTERSECT(BITMAP <value>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<value>` | Bitmap をサポートするデータ型 |

## 戻り値

Bitmap 型の値を返します。グループ内に有効なデータがない場合は NULL を返します。

## 例

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

今日と昨日の、タグごとのユーザーの継続利用状況を照会します。

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
