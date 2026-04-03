---
{
  "title": "ARRAY_PRODUCT",
  "language": "ja"
}
---
## array_product

<version since="2.0.0">

</version>

## 説明

配列内のすべての要素の積を計算します。この関数は配列内のすべての要素を反復処理し、それらを掛け合わせて結果を返します。

## 構文

```sql
array_product(ARRAY<T> arr)
```
### パラメータ

- `arr`：ARRAY<T>型、積を計算する配列

**Tでサポートされている型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- ブール型: BOOLEAN (trueは1に変換、falseは0に変換)

### 戻り値

戻り値の型: DOUBLEまたはDECIMAL

戻り値の意味:
- 配列内のすべての要素の積を返す
- NULL: 配列が空の場合、配列がNULLの場合、またはすべての要素がNULLの場合

使用上の注意:
- この関数は配列内のNULL値をスキップし、NULL以外の要素のみの積を計算する
- 配列内のすべての要素がNULLの場合、NULLを返す
- 空の配列はNULLを返す
- 複合型（MAP、STRUCT、ARRAY）は積の計算をサポートしておらず、エラーが発生する
- 配列要素内のnull値について: null要素は積の計算に参加しない

**クエリ例:**

整数配列の積を計算する:

```sql
SELECT array_product([1, 2, 3, 4, 5]);
+--------------------------------+
| array_product([1, 2, 3, 4, 5]) |
+--------------------------------+
|                            120 |
+--------------------------------+
```
float配列の積を計算する：

```sql
SELECT array_product([1.1, 2.2, 3.3, 4.4, 5.5]);
+------------------------------------------+
| array_product([1.1, 2.2, 3.3, 4.4, 5.5]) |
+------------------------------------------+
|                                    190.8 |
+------------------------------------------+
```
null値を含む配列の積を計算する：

```sql
SELECT array_product([1, null, 3, null, 5]);
+----------------------------------------+
| array_product([1, null, 3, null, 5])  |
+----------------------------------------+
| 15.0                                   |
+----------------------------------------+
```
ブール配列の積を計算します（true=1、false=0）：

```sql
SELECT array_product([true, false, true, true]);
+------------------------------------------+
| array_product([true, false, true, true]) |
+------------------------------------------+
|                                        0 |
+------------------------------------------+
```
空の配列はNULLを返します:

```sql
SELECT array_product([]);
+----------------------+
| array_product([])    |
+----------------------+
| NULL                 |
+----------------------+
```
全てがnull要素の配列はNULLを返します：

```sql
SELECT array_product([null, null, null]);
+----------------------------------+
| array_product([null, null, null]) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
複合型の例:

ネストされた配列型はサポートされておらず、エラーが発生します:

```sql
SELECT array_product([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<ARRAY<TINYINT>>
```
Map型はサポートされておらず、エラーが発生します：

```sql
SELECT array_product([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<MAP<VARCHAR(1),TINYINT>>
```
パラメータ数が間違っている場合のエラー:

```sql
SELECT array_product([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_product' which has 2 arity. Candidate functions are: [array_product(Expression)]
```
非配列型を渡した場合のエラー：

```sql
SELECT array_product('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_product(VARCHAR(12))
```
### Keywords

ARRAY, PRODUCT, ARRAY_PRODUCT
