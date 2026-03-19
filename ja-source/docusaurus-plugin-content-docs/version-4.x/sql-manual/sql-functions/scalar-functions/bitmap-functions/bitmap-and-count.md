---
{
  "title": "BITMAP_AND_COUNT",
  "description": "2つ以上の入力BITMAPの積集合を計算し、積集合の数を返します。",
  "language": "ja"
}
---
## 説明

2つ以上の入力BITMAPの積集合を計算し、積集合の数を返します。

## 構文

```sql
BITMAP_AND_COUNT(<bitmap>, <bitmap>,[, <bitmap>...])
```
## パラメータ

| Parameter  | デスクリプション                                                    |
|------------|----------------------------------------------------------------|
| `<bitmap>` | 積集合を求める対象となる元のBITMAPの1つ |

## 戻り値

整数を返します
- パラメータがNULL値の場合、0を返します

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
