---
{
    "title": "BITMAP_UNION",
    "language": "ja",
    "description": "入力された Bitmap の和集合を計算し、新しい Bitmap を返します。"
}
---

## 説明

入力された Bitmap の和集合を計算し、新しい Bitmap を返します。

## 構文

```sql
BITMAP_UNION(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | Bitmap をサポートするデータ型 |

## 戻り値

Bitmap 型の値を返します。グループ内に有効なデータがない場合は、空の Bitmap を返します。

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
