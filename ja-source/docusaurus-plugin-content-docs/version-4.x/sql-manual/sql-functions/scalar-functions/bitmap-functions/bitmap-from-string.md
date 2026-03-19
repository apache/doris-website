---
{
  "title": "BITMAP_FROM_STRING",
  "description": "文字列をBITMAPに変換します。文字列は、カンマで区切られた符号なしbigint数値のグループで構成されます。",
  "language": "ja"
}
---
## 説明

文字列をBITMAPに変換します。文字列は、カンマで区切られた符号なしbigint数値のグループで構成されます。（数値の範囲は：0 ～ 18446744073709551615）
例えば、文字列"0, 1, 2"は、0番目、1番目、2番目のビットが設定されたBitmapに変換されます。入力フィールドが無効な場合、NULLが返されます

## 構文

```sql
 BITMAP_FROM_STRING(<str>)
```
## パラメータ

| Parameter | デスクリプション                                                                                    |
|-----------|------------------------------------------------------------------------------------------------|
| `<str>`   | 配列文字列。例えば "0, 1, 2" 文字列は、ビット 0、1、2 がセットされた Bitmap に変換されます |  

## Return Value

BITMAP を返します
- 入力フィールドが無効な場合、結果は NULL です

## Examples

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 2")) bts;
```
```text
+-------+
| bts   |
+-------+
| 0,1,2 |
+-------+
```
```sql
select bitmap_to_string(bitmap_from_string("-1, 0, 1, 2")) bfs;
```
```text
+------+
| bfs  |
+------+
| NULL |
+------+
```
```sql
select bitmap_to_string(bitmap_from_string(NULL)) bfs;
```
```text
+------+
| bfs  |
+------+
| NULL |
+------+
```
```sql
select bitmap_to_string(bitmap_from_string("18446744073709551616, 1")) bfs;
```
```text
+------+
| bfs  |
+------+
| NULL |
+------+
```
```sql
select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615")) bts;
```
```text
+--------------------------+
| bts                      |
+--------------------------+
| 0,1,18446744073709551615 |
+--------------------------+
```
