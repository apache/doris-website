---
{
    "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
    "language": "ja",
    "description": "二つの BITMAP に差集合演算を行い、結果を返します。最初のパラメータを基準 BITMAP、次のパラメータを除外 BITMAP と呼びます。"
}
---

## 説明

二つの BITMAP に差集合演算を行い、結果を返します。最初のパラメータを `base BITMAP`、次のパラメータを `exclude BITMAP` と呼びます。

## 別名

- BITMAP_ANDNOT

## 構文

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<bitmap1>` | 差集合演算の基準となる `Base BITMAP` |
| `<bitmap2>` | 差集合から除外する `Exclusion BITMAP` |

## 戻り値

BITMAP を返します。
- パラメータが NULL の場合は NULL を返します

## 例

```sql
select bitmap_count(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) cnt;
```

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) as cnt;
```

```text
+------+
| cnt  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty())) cnt;
```

```text
+-------+
| cnt   |
+-------+
| 1,2,3 |
+-------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
