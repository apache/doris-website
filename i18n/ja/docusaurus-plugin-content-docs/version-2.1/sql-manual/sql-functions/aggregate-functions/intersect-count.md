---
{
  "title": "INTERSECT_COUNT",
  "language": "ja",
  "description": "INTERSECTCOUNT関数は、Bitmapデータ構造の交差する要素の数を計算するために使用されます。"
}
---
## 説明

INTERSECT_COUNT関数は、Bitmapデータ構造の交差する要素数を計算するために使用されます。

## 構文

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<bitmap_column>` | 取得する必要がある式。 |
| `<column_to_filter>` | オプション。フィルタリングする必要がある次元列。 |
| `<filter_values>` | オプション。フィルタリング次元列の異なる値。 |

## 戻り値

BIGINT型の値を返します。

## 例

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
