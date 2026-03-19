---
{
  "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
  "description": "2つのBITMAPに対してNOT演算を実行し、結果を返します。最初の入力パラメータはbase BITMAPと呼ばれ、2番目はexclude BITMAPと呼ばれます。",
  "language": "ja"
}
---
## デスクリプション

2つのBITMAPに対してNOT演算を実行し、結果を返します。最初の入力パラメータは`base BITMAP`と呼ばれ、2番目は`exclude BITMAP`と呼ばれます。

## Alias

- BITMAP_ANDNOT

## Syntax

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```
## パラメータ

| Parameter   | デスクリプション                      |
|-------------|----------------------------------|
| `<bitmap1>` | 否定される`Base BITMAP`      |
| `<bitmap2>` | 否定される`Exclusion BITMAP` |

## 戻り値

BITMAPを返します。
- パラメータがnull値の場合、NULLを返します

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
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')));
```
```text
+--------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'))) |
+--------------------------------------------------------------------------------------------+
| 1,2                                                                                        |
+--------------------------------------------------------------------------------------------+
```
```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty()));
```
```text
+-------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_empty())) |
+-------------------------------------------------------------------------------+
| 1,2,3                                                                         |
+-------------------------------------------------------------------------------+
```
```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL));
```
```text
+---------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), NULL)) |
+---------------------------------------------------------------------+
| NULL                                                                |
+---------------------------------------------------------------------+
```
