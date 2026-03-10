---
{
  "title": "BITMAP_AND_NOT_COUNT,BITMAP_ANDNOT_COUNT",
  "language": "ja",
  "description": "2つのBITMAPに対してNOT演算を実行し、結果セット内の要素数を返します。"
}
---
## 説明

2つのBITMAPに対してNOT演算を実行し、結果セット内の要素数を返します。最初の入力パラメータは`base BITMAP`と呼ばれ、2番目は`exclusion BITMAP`と呼ばれます。

## エイリアス

- BITMAP_ANDNOT_COUNT

## 構文

```sql
BITMAP_AND_NOT_COUNT(<bitmap1>, <bitmap2>)
```
## パラメータ

| Parameter   | Description                      |
|-------------|----------------------------------|
| `<bitmap1>` | 否定される`Base BITMAP`      |
| `<bitmap2>` | 否定される`Exclusion BITMAP` |

## 戻り値

整数を返します。
- パラメータがnull値の場合、NULLを返します

## 例

```sql
select bitmap_and_not_count(null, bitmap_from_string('1,2,3')) banc1, bitmap_and_not_count(bitmap_from_string('1,2,3') ,null) banc2;
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
