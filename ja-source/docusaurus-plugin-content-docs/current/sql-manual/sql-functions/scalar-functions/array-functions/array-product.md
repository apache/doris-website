---
{
  "title": "ARRAY_PRODUCT",
  "language": "ja",
  "description": "配列内のすべての要素の積を計算します。この関数は配列内のすべての要素を反復処理し、それらを掛け合わせます。"
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

- `arr`：ARRAY<T> 型、積を計算する配列

**T でサポートされる型：**
- 数値型: TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 真偽値型: BOOLEAN（true は 1 に、false は 0 に変換されます）

### 戻り値

戻り値の型: DOUBLE または DECIMAL

戻り値の意味:
- 配列内のすべての要素の積を返します
- NULL: 配列が空の場合、配列が NULL の場合、またはすべての要素が NULL の場合

使用上の注意:
- この関数は配列内の NULL 値をスキップし、NULL でない要素のみの積を計算します
- 配列内のすべての要素が NULL の場合、NULL を返します
- 空の配列は NULL を返します
- 複合型（MAP、STRUCT、ARRAY）は積の計算をサポートせず、エラーの原因となります
- 配列要素内の null 値について: null 要素は積の計算に参加しません

**クエリ例：**

整数配列の積を計算:

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
boolean配列の積を計算します（true=1、false=0）：

```sql
SELECT array_product([true, false, true, true]);
+------------------------------------------+
| array_product([true, false, true, true]) |
+------------------------------------------+
|                                        0 |
+------------------------------------------+
```
空の配列はNULLを返します：

```sql
SELECT array_product([]);
+----------------------+
| array_product([])    |
+----------------------+
| NULL                 |
+----------------------+
```
全ての要素がnullである配列はNULLを返します：

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
Map型はサポートされていないため、エラーが発生します：

```sql
SELECT array_product([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<MAP<VARCHAR(1),TINYINT>>
```
パラメータ数が間違っているエラー:

```sql
SELECT array_product([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_product' which has 2 arity. Candidate functions are: [array_product(Expression)]
```
非配列型を渡すときのエラー:

```sql
SELECT array_product('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_product(VARCHAR(12))
```
### キーワード

ARRAY, PRODUCT, ARRAY_PRODUCT
