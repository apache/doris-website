---
{
  "title": "BITMAP_UNION_COUNT",
  "description": "入力されたBitmapの和集合を計算し、そのカーディナリティを返します。",
  "language": "ja"
}
---
## デスクリプション

入力されたBitmapの和集合を計算し、その濃度を返します。

## Syntax

```sql
BITMAP_UNION_COUNT(<expr>)
```
## 引数

| 引数 | 説明 |
| -- | -- |
| `<expr>` | Bitmapをサポートするデータ型 |

## 戻り値

Bitmap結合のサイズ、すなわち重複のない要素の数を返します。グループに有効なデータが存在しない場合は0を返します。

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
異なるuser_id値の数を数えます。

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
