---
{
    "title": "BITMAP_AND_NOT_COUNT,BITMAP_ANDNOT_COUNT",
    "language": "ja",
    "description": "二つの BITMAP に差集合演算を行い、結果の要素数を返します。"
}
---

## 説明

二つの BITMAP に差集合演算を行い、結果の要素数を返します。最初のパラメータを `base BITMAP`、次のパラメータを `exclusion BITMAP` と呼びます。

## 別名

- BITMAP_ANDNOT_COUNT

## 構文

```sql
BITMAP_AND_NOT_COUNT(<bitmap1>, <bitmap2>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<bitmap1>` | 差集合演算の基準となる `Base BITMAP` |
| `<bitmap2>` | 差集合から除外する `Exclusion BITMAP` |

## 戻り値

整数を返します。
- パラメータが NULL の場合は 0 を返します

## 例

```sql
select bitmap_and_not_count(NULL, bitmap_from_string('1,2,3')) banc1, bitmap_and_not_count(bitmap_from_string('1,2,3'), NULL) banc2;
```

```text
+-------+-------+
| banc1 | banc2 |
+-------+-------+
|     0 |     0 |
+-------+-------+
```

```sql
select bitmap_and_not_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) banc;
```

```text
+------+
| banc |
+------+
|    2 |
+------+
```
