---
{
  "title": "BITMAP_OR_COUNT",
  "language": "ja",
  "description": "2つ以上の入力Bitmapの和集合を計算し、和集合内の要素数を返します。"
}
---
## 説明

2つ以上の入力Bitmapの和集合を計算し、和集合内の要素数を返します。

## 構文

```sql
BITMAP_OR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```
## Parameters

| Parameter   | Description    |
|-------------|----------------|
| `<bitmap1>` | 最初のBitmap   |
| `<bitmap2>` | 2番目のBitmap  |
| ...         | ...            |
| `<bitmapN>` | N番目のBitmap   |

## Return Value

複数のBitmapの和集合における要素数。

## Examples

空でないBitmapと空のBitmapの和集合における要素数を計算するには：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty()) res;
```
結果は次のようになります：

```text
+------+
| res  |
+------+
|    3 |
+------+
```
2つの同一のBitmapの和集合における要素数を計算するには：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```
結果は次のようになります：

```text
+------+
| res  |
+------+
|    3 |
+------+
```
2つの異なるBitmapの和集合における要素数を計算するには：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```
結果は以下のようになります:

```text
+------+
| res  |
+------+
|    5 |
+------+
```
空のBitmapを含む複数のBitmapの和集合における要素数を計算するには：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty()) res;
```
結果は以下のようになります：

```text
+------+
| res  |
+------+
|    6 |
+------+
```
複数のBitmapの和集合における要素数を計算するには、`NULL`値を含めて：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL) res;
```
結果は以下のようになります：

```text
+------+
| res  |
+------+
|    6 |
+------+
```
