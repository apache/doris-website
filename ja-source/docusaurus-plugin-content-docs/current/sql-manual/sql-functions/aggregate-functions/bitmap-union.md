---
{
  "title": "BITMAP_UNION",
  "language": "ja",
  "description": "入力されたBitmapの和集合を計算し、新しいBitmapを返します。"
}
---
## 説明

入力されたBitmapの和集合を計算し、新しいBitmapを返します。

## 構文

```sql
BITMAP_UNION(<expr>)
```
## 引数

| 引数 | 説明 |
| -- | -- |
| `<expr>` | Bitmapをサポートするデータ型 |

## 戻り値

Bitmap型の値を返します。グループに有効なデータがない場合は、空のBitmapを返します。

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
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap;
```
```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
| 100,200,300                             |
+-----------------------------------------+
```
```sql
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap where user_id is null;
```
```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
|                                         |
+-----------------------------------------+
```
