---
{
    "title": "BITMAP_OR_COUNT",
    "language": "ja",
    "description": "入力された二つ以上の BITMAP の和集合を計算し、その要素数を返します。"
}
---

## 説明

入力された二つ以上の BITMAP の和集合を計算し、その要素数を返します。

## 構文

```sql
BITMAP_OR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## パラメータ

| パラメータ   | 説明    |
|-------------|----------------|
| `<bitmap1>` | 最初の BITMAP   |
| `<bitmap2>` | 二番目の BITMAP  |
| ...         | ...            |
| `<bitmapN>` | N 番目の BITMAP   |

## 戻り値

複数の BITMAP の和集合に含まれる要素数を返します。  

## 例

空でない BITMAP と空の BITMAP の和集合に含まれる要素数を計算します。

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty()) res;
```

結果は次のとおりです。

```text
+------+
| res  |
+------+
|    3 |
+------+
```

同じ二つの BITMAP の和集合に含まれる要素数を計算します。

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

結果は次のとおりです。

```text
+------+
| res  |
+------+
|    3 |
+------+
```

異なる二つの BITMAP の和集合に含まれる要素数を計算します。

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

結果は次のとおりです。

```text
+------+
| res  |
+------+
|    5 |
+------+
```

空の BITMAP を含む複数の BITMAP の和集合に含まれる要素数を計算します。

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty()) res;
```

結果は次のとおりです。

```text
+------+
| res  |
+------+
|    6 |
+------+
```

`NULL` 値を含む複数の BITMAP の和集合に含まれる要素数を計算します。

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL) res;
```

結果は次のとおりです。

```text
+------+
| res  |
+------+
|    6 |
+------+
```
