---
{
  "title": "BITMAP-UNION-INT",
  "language": "ja",
  "description": "入力式の異なる値の数をカウントします。戻り値はCOUNT(DISTINCT expr)と同じです。"
}
---
## 説明

入力式の個別値の数をカウントします。戻り値はCOUNT(DISTINCT expr)と同じです。

## 構文

```sql
BITMAP_UNION_INT(<expr>)
```
## 引数

| 引数 | 説明 |
| -- | -- |
| `<expr>` | 入力式。サポートされる型：TinyInt、SmallInt、Integer。 |

## 戻り値

列内の異なる値の数を返します。グループ内に有効なデータがない場合は、0を返します。

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
    (1, 300, to_bitmap(300)),
    (2, 200, to_bitmap(300));
```
```sql
select bitmap_union_int(dt) from pv_bitmap;
```
```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    2 |
+----------------------+
```
```sql
select bitmap_union_int(dt) from pv_bitmap where dt is null;
```
```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    0 |
+----------------------+
```
