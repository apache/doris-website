---
{
  "title": "BITMAP_XOR",
  "description": "2つ以上の入力Bitmapの対称差集合（XOR演算）を計算し、新しいBitmapを返します。",
  "language": "ja"
}
---
## 説明

2つ以上の入力Bitmapの対称差集合（XOR演算）を計算し、新しいBitmapを返します。

## 構文

```sql
BITMAP_XOR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```
## パラメータ

| Parameter   | デスクリプション       |
|-------------|-------------------|
| `<bitmap1>` | 最初のBitmap  |
| `<bitmap2>` | 2番目のBitmap |
| ...         | ...               |
| `<bitmapN>` | N番目のBitmap   |

## Return Value

複数のBitmapの対称差を表すBitmap。
- パラメータがNULL値の場合、NULLを返します

## Examples

2つのBitmapの対称差を計算するには：

```sql
select bitmap_count(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) cnt;
```
結果は以下のようになります：

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```
2つのBitmapの対称差分を文字列に変換するには：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) res;
```
結果は次のようになります：

```text
+------+
| res  |
+------+
| 1,4  |
+------+
```
3つのBitmapの対称差を計算するには：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'))) res;
```
結果は次のようになります：

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```
空のBitmapを含む複数のBitmapの対称差を計算するには：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty())) res;
```
結果は以下のようになります：

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```
複数のBitmapの対称差を計算するには、`NULL`値を含めて：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL)) res;
```
結果は以下のようになります：

```text
+------+
| res  |
+------+
| NULL |
+------+
```
