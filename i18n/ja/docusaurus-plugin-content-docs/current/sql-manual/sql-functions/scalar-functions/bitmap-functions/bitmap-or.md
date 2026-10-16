---
{
    "title": "BITMAP_OR",
    "language": "ja",
    "description": "二つ以上の BITMAP の和集合を計算し、新しい BITMAP を返します。"
}
---

## 説明

二つ以上の BITMAP の和集合を計算し、新しい BITMAP を返します。

## 構文

```sql
BITMAP_OR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## パラメータ

| パラメータ | 説明 |
|-------------|----------------|
| `<bitmap1>` | 最初の BITMAP |
| `<bitmap2>` | 二番目の BITMAP |
| ...         | ...            |
| `<bitmapN>` | N 番目の BITMAP |

## 戻り値

複数の BITMAP の和集合を表す BITMAP を返します。

## 例

同じ二つの BITMAP の和集合の要素数を計算します。

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(1))) cnt;
```

結果は次のとおりです。

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

同じ二つの BITMAP の和集合を文字列に変換します。

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) as res;
```

結果は次のとおりです。

```text
+------+
| res  |
+------+
| 1    |
+------+
```

異なる二つの BITMAP の和集合の要素数を計算します。

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(2))) cnt;
```

結果は次のとおりです。

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

異なる二つの BITMAP の和集合を文字列に変換します。

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) res;
```

結果は次のとおりです。

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

`NULL` 値を含む複数の BITMAP の和集合を計算します。

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL)) res;
```

結果は次のとおりです。

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

空の BITMAP を含む複数の BITMAP の和集合を計算します。

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty())) res;
```

結果は次のとおりです。

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

文字列と個別の値から作成した BITMAP の和集合を計算します。

```sql
select bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) res;
```

結果は次のとおりです。

```text
+--------------+
| res          |
+--------------+
| 1,2,3,4,5,10 |
+--------------+
```
