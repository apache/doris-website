---
{
  "title": "ARRAY_CONCAT",
  "language": "ja"
}
---
## array_concat

<version since="2.0.0">


</version>

## 説明

すべての入力配列を単一の配列に連結します。この関数は1つまたは複数の配列をパラメータとして受け取り、パラメータの順序で新しい配列に結合します。

## 構文

```sql
array_concat(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```
### パラメータ

- `arr1, arr2, ...`：ARRAY\<T> 型、連結する配列。列名または定数値をサポート。

**T がサポートする型：**
- 数値型：TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型：CHAR, VARCHAR, STRING
- 日付と時刻型：DATE, DATETIME, DATEV2, DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4, IPV6
- 複合データ型：ARRAY, MAP, STRUCT

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- 入力配列のすべての要素を含む連結された新しい配列で、元の順序を維持する
- NULL：いずれかの入力配列が NULL の場合

使用上の注意：
- 空の配列は無視され、要素を追加しません
- 配列が1つだけで空の場合は空の配列を返し、配列が1つだけで NULL の場合は NULL を返します
- 複合型（ネストした配列、MAP、STRUCT）は連結時に完全に一致した構造が必要で、そうでなければエラーが発生します
- 配列要素内の null 値について：null 要素は連結結果で正常に保持されます

### 例

```sql
CREATE TABLE array_concat_test (
    id INT,
    int_array1 ARRAY<INT>,
    int_array2 ARRAY<INT>,
    string_array1 ARRAY<STRING>,
    string_array2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_concat_test VALUES
(1, [1, 2, 3], [4, 5, 6], ['a', 'b'], ['c', 'd']),
(2, [10, 20], [30, 40], [], ['x', 'y']),
(3, NULL, [100, 200], NULL, ['z']),
(4, [], [], [], []),
(5, [1, null, 3], [null, 5, 6], ['a', null, 'c'], ['d', 'e']);
```
**クエリの例:**

複数の配列リテラルを連結する場合:

```sql
SELECT array_concat([1, 2], [7, 8], [5, 6]);
+--------------------------------------+
| array_concat([1, 2], [7, 8], [5, 6]) |
+--------------------------------------+
| [1, 2, 7, 8, 5, 6]                   |
+--------------------------------------+
```
文字列配列の連結:

```sql
SELECT array_concat(string_array1, string_array2) FROM array_concat_test WHERE id = 1;
+--------------------------------------------+
| array_concat(string_array1, string_array2) |
+--------------------------------------------+
| ["a", "b", "c", "d"]                       |
+--------------------------------------------+
```
空配列の連結:

```sql
SELECT array_concat([], []);
+----------------------+
| array_concat([], []) |
+----------------------+
| []                   |
+----------------------+
```
NULL配列の連結：

```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 3;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```
null要素を含む配列の連結: null要素は連結結果において通常保持されます。

```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 5;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| [1, null, 3, null, 5, 6]             |
+--------------------------------------+
```
型互換性の例: int_array1 と string_array1 を連結する場合、string 要素は int に変換できないため、結果は null になります。

```sql
SELECT array_concat(int_array1, string_array1) FROM array_concat_test WHERE id = 1;
+-----------------------------------------+
| array_concat(int_array1, string_array1) |
+-----------------------------------------+
| [1, 2, 3, null, null]                   |
+-----------------------------------------+
```
複合型の例:

ネストした配列の連結。構造が一致している場合に連結できます。

```sql
SELECT array_concat([[1,2],[3,4]], [[5,6],[7,8]]);
+--------------------------------------------+
| array_concat([[1,2],[3,4]], [[5,6],[7,8]]) |
+--------------------------------------------+
| [[1, 2], [3, 4], [5, 6], [7, 8]]           |
+--------------------------------------------+
```
ネストされた配列構造が一貫していない場合、エラーがスローされます。

```sql
SELECT array_concat([[1,2]], [{'k':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<ARRAY<INT>> to target type=ARRAY<DOUBLE>
```
Map型の連結は、構造が一致している場合に連結することができます。

```sql
SELECT array_concat([{'k':1}], [{'k':2}]);
+------------------------------------+
| array_concat([{'k':1}], [{'k':2}]) |
+------------------------------------+
| [{"k":1}, {"k":2}]                 |
+------------------------------------+
```
構造体型の連結は、構造が一致している場合に連結することができます。

```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30)));
+--------------------------------------------------------------------------------------------------------+
| array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30))) |
+--------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                                                 |
+--------------------------------------------------------------------------------------------------------+
```
構造体の構造に一貫性がない場合、エラーがスローされます。

```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('id',1,'score',95.5,'age',10)));
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<STRUCT<name:VARCHAR(5),age:TINYINT>> to target type=ARRAY<DOUBLE>
```
パラメータの数が正しくない場合、エラーが発生します。

```sql
SELECT array_concat();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_concat' which has 0 arity. Candidate functions are: [array_concat(Expression, Expression, ...)]
```
非配列型を渡すとエラーが発生します。

```sql
SELECT array_concat('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_concat(VARCHAR(12))
```
### 注釈

すべての入力配列要素の型が互換性があることを確認してください。特にネストした複合型については、実行時の型変換エラーを避けるために構造が一貫している必要があります。

### Keywords

ARRAY, CONCAT, ARRAY_CONCAT
