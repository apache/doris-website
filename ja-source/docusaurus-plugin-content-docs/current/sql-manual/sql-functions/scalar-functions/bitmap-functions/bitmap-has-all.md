---
{
  "title": "BITMAP_HAS_ALL",
  "language": "ja",
  "description": "一つのBitmapが別のBitmapのすべての要素を含んでいるかどうかを判定します。"
}
---
## 説明

あるBitmapが別のBitmapのすべての要素を含んでいるかどうかを判定します。

## 構文

```sql
BITMAP_HAS_ALL(<bitmap1>, <bitmap2>)
```
## パラメータ

| Parameter   | Description       |
|-------------|-------------------|
| `<bitmap1>` | 最初のBitmap  |
| `<bitmap2>` | 2番目のBitmap |

## 戻り値

`<bitmap1>`が`<bitmap2>`のすべての要素を含む場合、`true`を返します；  
`<bitmap2>`に要素が含まれていない場合、`true`を返します；  
それ以外の場合、`false`を返します。
- パラメータがNULL値の場合、NULLを返します

## 例

あるBitmapが別のBitmapのすべての要素を含むかどうかを確認するには：

```sql
select bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) as res;
```
結果は次のようになります：

```text
+------+
| res  |
+------+
|    1 |
+------+
```
空のBitmapが別のBitmapのすべての要素を含んでいるかどうかを確認するには：

```sql
select bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) as res;
```
結果は次のようになります:

```text
+------+
| res  |
+------+
|    0 |
+------+
```
```sql
select bitmap_has_all(bitmap_empty(), NULL) as res;
```
結果は次のようになります:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
