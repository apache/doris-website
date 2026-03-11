---
{
  "title": "BITMAP-UNION-INT",
  "description": "TINYINT、SMALLINT、INT型の列における異なる値の数を数えます。戻り値はCOUNT(DISTINCT expr)と同じです。",
  "language": "ja"
}
---
## 説明

TINYINT、SMALLINT、INT型の列における異なる値の数をカウントします。戻り値はCOUNT(DISTINCT expr)と同じです。

## 構文

```sql
BITMAP_UNION_INT(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | TINYINT、SMALLINT、INT型の列または列式をサポートします |

## Return Value

列内の異なる値の数を返します。

## Example

```sql
select dt,page,bitmap_to_string(user_id) from pv_bitmap;
```
```text
+------+------+---------------------------+
| dt   | page | bitmap_to_string(user_id) |
+------+------+---------------------------+
|    1 | 100  | 100,200,300               |
|    1 | 300  | 300                       |
|    2 | 200  | 300                       |
+------+------+---------------------------+
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
