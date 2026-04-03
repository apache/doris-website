---
{
  "title": "BITMAP_XOR_COUNT",
  "language": "ja",
  "description": "2つ以上のBitmapセットの対称差集合（XOR演算）を計算し、結果セット内の要素数を返します。"
}
---
## 説明

2つ以上のBitmapセットの対称差集合（XOR演算）を計算し、結果セット内の要素数を返します。

## 構文

```sql
BITMAP_XOR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```
## パラメータ

| Parameter   | Description       |
|-------------|-------------------|
| `<bitmap1>` | 最初のBitmap  |
| `<bitmap2>` | 2番目のBitmap |
| ...         | ...               |
| `<bitmapN>` | N番目のBitmap   |

## 戻り値

複数のBitmapのXOR演算の結果として得られるBitmap内の要素数。  
入力されたBitmapパラメータのいずれかが`NULL`の場合は0を返します。

## 例

2つのBitmapの対称差集合における要素数を計算するには：

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```
結果は以下のようになります：

```text
+------+
| res  |
+------+
|    4 |
+------+
```
2つの同一のBitmapの対称差集合における要素数を計算するには:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```
結果は次のようになります：

```text
+------+
| res  |
+------+
|    0 |
+------+
```
2つの異なるBitmapの対称差集合における要素数を計算するには：

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('4,5,6')) res;
```
結果は以下のようになります：

```text
+------+
| res  |
+------+
|    6 |
+------+
```
3つのBitmapの対称差集合における要素数を計算するには:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5')) res;
```
結果は次のようになります：

```text
+------+
| res  |
+------+
|    3 |
+------+
```
空のBitmapを含む、複数のBitmapの対称差集合に含まれる要素数を計算するには：

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty());
```
結果は次のようになります：

```text
+------+
| res  |
+------+
|    3 |
+------+
```
`NULL`値を含む複数のBitmapの対称差集合における要素数を計算するには：

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL) res;
```
結果は以下のようになります：

```text
+------+
| res  |
+------+
|    0 |
+------+
```
