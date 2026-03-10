---
{
  "title": "BITMAP_HAS_ANY",
  "language": "ja",
  "description": "二つのBitmapが共通の要素を持つかどうかを判定します。"
}
---
## 説明

2つのBitmapが共通の要素を持つかどうかを判定します。

## 構文

```sql
BITMAP_HAS_ANY(<bitmap1>, <bitmap2>)
```
## パラメータ

| Parameter   | Description          |
|-------------|----------------------|
| `<bitmap1>` | 最初のBitmap     |
| `<bitmap2>` | 2番目のBitmap    |

## 戻り値

2つのBitmapに共通の要素がある場合はtrueを返します；  
2つのBitmapに共通の要素がない場合はfalseを返します。

## 例

```sql
mysql> select bitmap_has_any(to_bitmap(1), to_bitmap(2));
```
```text
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(2)) |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+
```
```sql
mysql> select bitmap_has_any(to_bitmap(1), to_bitmap(1));
```
```text
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(1)) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```
