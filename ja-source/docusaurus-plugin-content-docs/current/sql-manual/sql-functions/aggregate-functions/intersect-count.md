---
{
  "title": "INTERSECT_COUNT",
  "language": "ja",
  "description": "2つ以上のbitmapの積集合を計算する 使用法: intersectcount(bitmapcolumntocount, filtercolumn, filtervalues ..."
}
---
## 説明

2つ以上のビットマップの積集合を計算する
使用方法: intersect_count(bitmap_column_to_count, filter_column, filter_values ...)
例: intersect_count(user_id, event, 'A', 'B', 'C')、これはA/B/C 3つのビットマップ全てのuser_idの積集合カウントを求めることを意味する
filter_values内でcolumn_to_filterに一致するbitmap_column内の要素の積集合カウントを計算する、すなわちビットマップ積集合カウント。

## 構文

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values> [, ...])
```
## パラメータ

| パラメータ | 説明 |
|------------------|--------------------------------------------------|
| `<bitmap_column>`  | 入力bitmapパラメータカラム。サポートされる型：Bitmap。 |
| `<column_to_filter>` | フィルタリングに使用されるディメンションカラム。サポートされる型：TinyInt、SmallInt、Integer、BigInt、LargeInt。 |
| `<filter_values>`  | ディメンションカラムのフィルタリングに使用される異なる値。サポートされる型：TinyInt、SmallInt、Integer、BigInt、LargeInt。 |


## 戻り値

指定されたbitmapの積集合の要素数を返します。

## 例

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
