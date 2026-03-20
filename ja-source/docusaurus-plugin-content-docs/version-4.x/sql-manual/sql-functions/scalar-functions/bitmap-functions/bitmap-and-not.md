---
{
  "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
  "description": "2つのBITMAPに対してNOT演算を実行し、結果を返します。最初の入力パラメータはbase BITMAPと呼ばれ、2番目はexclude BITMAPと呼ばれます。",
  "language": "ja"
}
---
## 説明

2つのBITMAPに対してNOT演算を実行し、結果を返します。最初の入力パラメータは`base BITMAP`と呼ばれ、2つ目は`exclude BITMAP`と呼ばれます。

## エイリアス

- BITMAP_ANDNOT

## 構文

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```
## パラメータ

| Parameter   | デスクリプション                      |
|-------------|----------------------------------|
| `<bitmap1>` | 否定されるベース BITMAP      |
| `<bitmap2>` | 否定される除外 BITMAP |

## 戻り値

BITMAP を返します。
- パラメータが NULL 値の場合、NULL を返します

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
