---
{
  "title": "BITMAP_HAS_ANY",
  "description": "2つのBitmapが共通の要素を持つかどうかを判定します。",
  "language": "ja"
}
---
## 説明

2つのBitmapに共通の要素があるかどうかを判定します。

## 構文

```sql
BITMAP_HAS_ANY(<bitmap1>, <bitmap2>)
```
## パラメータ

| Parameter   | デスクリプション          |
|-------------|----------------------|
| `<bitmap1>` | 最初のBitmap     |
| `<bitmap2>` | 2番目のBitmap    |

## Return Value

2つのBitmapに共通要素がある場合はtrueを返します。  
2つのBitmapに共通要素がない場合はfalseを返します。
- パラメータがNULL値の場合、NULLを返します

## Examples

```sql
select bitmap_has_any(to_bitmap(1), to_bitmap(2)) res;
```
```text
+------+
| res  |
+------+
|    0 |
+------+
```
```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), to_bitmap(1)) res;
```
```text
+------+
| res  |
+------+
|    1 |
+------+
```
```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), NULL) as res;
```
```text
+------+
| res  |
+------+
| NULL |
+------+
```
