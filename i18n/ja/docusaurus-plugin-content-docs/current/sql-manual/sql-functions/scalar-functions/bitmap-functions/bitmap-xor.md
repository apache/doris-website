---
{
    "title": "BITMAP_XOR",
    "language": "ja",
    "description": "複数の Bitmap の対称差（XOR 演算）を計算し、新しい Bitmap を返します。"
}
---

## 説明

複数の Bitmap の対称差（XOR 演算）を計算し、新しい Bitmap を返します。

## 構文

```sql
BITMAP_XOR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 引数

| 引数        | 説明             |
|-------------|-------------------|
| `<bitmap1>` | 最初の Bitmap    |
| `<bitmap2>` | 次の Bitmap      |
| ...         | ...              |
| `<bitmapN>` | N 番目の Bitmap  |

## 戻り値

複数の Bitmap の対称差を表す Bitmap を返します。
- 引数に NULL 値が含まれる場合は NULL を返します。

## 例

二つの Bitmap の対称差を計算する場合:

```sql
select bitmap_count(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) cnt;
```

実行結果:

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

二つの Bitmap の対称差を文字列に変換する場合:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) res;
```

実行結果:

```text
+------+
| res  |
+------+
| 1,4  |
+------+
```

三つの Bitmap の対称差を計算する場合:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'))) res;
```

実行結果:

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

空の Bitmap を含む複数の Bitmap の対称差を計算する場合:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty())) res;
```

実行結果:

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

`NULL` 値を含む複数の Bitmap の対称差を計算する場合:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL)) res;
```

実行結果:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
