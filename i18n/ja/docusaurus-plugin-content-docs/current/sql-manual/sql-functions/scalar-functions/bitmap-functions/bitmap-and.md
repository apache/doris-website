---
{
    "title": "BITMAP_AND",
    "language": "ja",
    "description": "入力した二つ以上の BITMAP の積集合を計算し、新しい BITMAP を返します。"
}
---

## 説明

入力した二つ以上の BITMAP の積集合を計算し、新しい BITMAP を返します。

## 構文

```sql
BITMAP_AND(<bitmap>, <bitmap>,[, <bitmap>...])
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<bitmap>` | 積集合を求める対象の BITMAP の一つ |

## 戻り値

BITMAP を返します
- パラメータが NULL の場合は NULL を返します

## 例

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) as res;
```

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty())) as res;
```

```text
+------+
| res  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
