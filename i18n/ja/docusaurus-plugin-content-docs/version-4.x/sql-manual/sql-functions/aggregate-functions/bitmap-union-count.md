---
{
    "title": "BITMAP_UNION_COUNT",
    "language": "ja",
    "description": "入力された Bitmap の和集合を計算し、その要素数を返します。"
}
---

## 説明

入力された Bitmap の和集合を計算し、その要素数を返します。

## 構文

```sql
BITMAP_UNION_COUNT(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | Bitmap をサポートするデータ型 |

## 戻り値

Bitmap の和集合の要素数、つまり重複しない要素の数を返します。グループ内に有効なデータがない場合は 0 を返します。

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

重複を除いた user_id の値の数を数えます。

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
