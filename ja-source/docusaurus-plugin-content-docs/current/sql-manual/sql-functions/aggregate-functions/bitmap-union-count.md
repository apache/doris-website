---
{
  "title": "BITMAP_UNION_COUNT",
  "language": "ja",
  "description": "入力されたBitmapの和集合を計算し、その基数を返します。"
}
---
## 説明

入力されたBitmapの和集合を計算し、その濃度を返します。

## 構文

```sql
BITMAP_UNION_COUNT(<expr>)
```
## 引数

| 引数 | 説明 |
| -- | -- |
| `<expr>` | Bitmapをサポートするデータ型 |

## 戻り値

Bitmap unionのサイズ、つまり異なる要素の数を返します。グループ内に有効なデータがない場合は、0を返します。

## 例

```sql
-- setup
CREATE TABLE pv_bitmap (
    dt INT,
    page INT,
    user_id BITMAP
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
    (1, 100, to_bitmap(100)),
    (1, 100, to_bitmap(200)),
    (1, 100, to_bitmap(300)),
    (2, 200, to_bitmap(300));
```
```sql
select bitmap_union_count(user_id) from pv_bitmap;
```
異なるuser_id値の数をカウントします。

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           3 |
+-----------------------------+
```
```sql
select bitmap_union_count(user_id) from pv_bitmap where user_id is null;
```
```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           0 |
+-----------------------------+
```
