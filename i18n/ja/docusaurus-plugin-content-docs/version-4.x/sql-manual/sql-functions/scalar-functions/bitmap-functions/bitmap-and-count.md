---
{
    "title": "BITMAP_AND_COUNT",
    "language": "ja",
    "description": "入力した二つ以上の BITMAP の積集合を計算し、その要素数を返します。"
}
---

## 説明

入力した二つ以上の BITMAP の積集合を計算し、その要素数を返します。

## 構文

```sql
BITMAP_AND_COUNT(<bitmap>, <bitmap>,[, <bitmap>...])
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<bitmap>` | 積集合を求める対象の BITMAP の一つ |

## 戻り値

整数を返します
- パラメータが NULL の場合は 0 を返します

## 例

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    2 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty()) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), NULL) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

