---
{
    "title": "BITMAP_XOR_COUNT",
    "language": "ja",
    "description": "二つ以上の Bitmap の対称差（XOR 演算）を計算し、結果の集合の要素数を返します。"
}
---

## 説明

二つ以上の Bitmap の対称差（XOR 演算）を計算し、結果の集合の要素数を返します。

## 構文

```sql
BITMAP_XOR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 引数

| 引数        | 説明             |
|-------------|------------------|
| `<bitmap1>` | 最初の Bitmap    |
| `<bitmap2>` | 二番目の Bitmap  |
| ...         | ...              |
| `<bitmapN>` | N 番目の Bitmap  |

## 戻り値

複数の Bitmap の XOR 演算で得られた Bitmap の要素数を返します。  
入力した Bitmap 引数のいずれかが `NULL` の場合は 0 を返します。

## 例

二つの Bitmap の対称差の要素数を計算する場合:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

実行結果:

```text
+------+
| res  |
+------+
|    4 |
+------+
```

同じ内容の二つの Bitmap の対称差の要素数を計算する場合:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

実行結果:

```text
+------+
| res  |
+------+
|    0 |
+------+
```

異なる二つの Bitmap の対称差の要素数を計算する場合:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('4,5,6')) res;
```

実行結果:

```text
+------+
| res  |
+------+
|    6 |
+------+
```

三つの Bitmap の対称差の要素数を計算する場合:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5')) res;
```

実行結果:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

空の Bitmap を含む複数の Bitmap の対称差の要素数を計算する場合:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty());
```

実行結果:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

`NULL` 値を含む複数の Bitmap の対称差の要素数を計算する場合:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL) res;
```

実行結果:

```text
+------+
| res  |
+------+
|    0 |
+------+
```
