---
{
  "title": "BITMAP_OR",
  "language": "ja",
  "description": "2つ以上のBitmapの和集合を計算し、新しいBitmapを返します。"
}
---
## 説明

2つ以上のBitmapの和集合を計算し、新しいBitmapを返します。

## 構文

```sql
BITMAP_OR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```
## パラメータ

| Parameter   | Description    |
|-------------|----------------|
| `<bitmap1>` | 最初のBitmap   |
| `<bitmap2>` | 2番目のBitmap  |
| ...         | ...            |
| `<bitmapN>` | N番目のBitmap   |

## 戻り値

複数のBitmapの和集合を表すBitmap。

## 例

2つの同一のBitmapの和集合を計算するには：

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(1))) cnt;
```
結果は次のようになります:

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```
2つの同一のBitmapの和集合を文字列に変換するには：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) as res;
```
結果は次のようになります：

```text
+------+
| res  |
+------+
| 1    |
+------+
```
2つの異なるBitmapの和集合を計算するには:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(2))) cnt;
```
結果は以下のようになります：

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```
2つの異なるBitmapの和集合を文字列に変換するには：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) res;
```
結果は以下のようになります:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```
複数のBitmapのunionを計算するには、`NULL`値を含めて：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL)) res;
```
結果は次のようになります：

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```
空のBitmapを含む複数のBitmapの和集合を計算するには：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty())) res;
```
結果は次のようになります：

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```
文字列と個別の値から作成されたBitmapの和集合を計算するには：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) res;
```
結果は次のようになります：

```text
+--------------+
| res          |
+--------------+
| 1,2,3,4,5,10 |
+--------------+
```
