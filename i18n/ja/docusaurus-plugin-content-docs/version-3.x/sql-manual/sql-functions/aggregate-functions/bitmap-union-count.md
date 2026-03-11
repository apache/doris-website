---
{
  "title": "BITMAP_UNION_COUNT",
  "description": "入力されたBitmapの和集合を計算し、そのカーディナリティを返します。",
  "language": "ja"
}
---
## 説明

入力されたBitmapの和集合を計算し、そのカーディナリティを返します。

## 構文

```sql
BITMAP_UNION_COUNT(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | BITMAPでサポートされるデータ型 |

## Return Value

Bitmapユニオンのサイズ、つまり重複排除後の要素数を返します

## Example

```sql
select dt,page,bitmap_to_string(user_id) from pv_bitmap;
```
```text
+------+------+---------------------------+
| dt   | page | bitmap_to_string(user_id) |
+------+------+---------------------------+
|    1 | 100  | 100,200,300               |
|    2 | 200  | 300                       |
+------+------+---------------------------+
```
user_idの重複排除値を計算する：

```
select bitmap_union_count(user_id) from pv_bitmap;
```
```text
+-------------------------------------+
| bitmap_count(bitmap_union(user_id)) |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```
