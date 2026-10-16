---
{
    "title": "INTERSECT_COUNT",
    "language": "ja",
    "description": "二つ以上のビットマップの積集合を計算します。使用方法: intersectcount(bitmapcolumntocount, filtercolumn, filtervalues ..."
}
---

## 説明

二つ以上のビットマップの積集合を計算します。
使用方法: intersect_count(bitmap_column_to_count, filter_column, filter_values ...)
例: intersect_count(user_id, event, 'A', 'B', 'C') は、A/B/C に対応する 3 つのビットマップすべてに共通する user_id の数を求めます。
filter_values に含まれる値と column_to_filter が一致する bitmap_column のビットマップについて、積集合の要素数を計算します。

## 構文

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values> [, ...])
```

## パラメータ  

| パラメータ         | 説明                                      |
|------------------|--------------------------------------------------|
| `<bitmap_column>`  | 入力するビットマップの列。サポートされる型: Bitmap。 |
| `<column_to_filter>` | フィルタリングに使用するディメンション列。サポートされる型: TinyInt、SmallInt、Integer、BigInt、LargeInt。 |
| `<filter_values>`  | ディメンション列のフィルタリングに使用する各値。サポートされる型: TinyInt、SmallInt、Integer、BigInt、LargeInt。 |


## 戻り値  

指定したビットマップの積集合に含まれる要素数を返します。

## 使用例

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
