---
{
  "title": "ARRAY_ENUMERATE_UNIQ",
  "language": "ja",
  "description": "配列内の各要素に対して一意の出現回数番号を返します。この関数は配列内の各要素に対して番号を生成し、"
}
---
## array_enumerate_uniq

<version since="2.0.0">

</version>

## 説明

配列内の各要素に対してユニークな出現回数番号を返します。この関数は、配列内の各要素に対して番号を生成し、その要素が配列内に何回出現したかを示します。

## 構文

```sql
array_enumerate_uniq(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```
### パラメータ

- `arr1, arr2, ...`：ARRAY<T>型、一意の番号を生成する配列。1つまたは複数の配列パラメータをサポートします。

**Tでサポートされる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付・時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean型: BOOLEAN
- IP型: IPV4, IPV6

### 戻り値

戻り値の型: ARRAY<BIGINT>

戻り値の意味:
- 入力配列と同じ長さの新しい配列を返します。各位置には、配列内の対応する要素の一意の出現回数番号が含まれます
- NULL: 入力配列がNULLの場合

使用上の注意:
- この関数は配列内の各要素に対して一意の番号を生成し、1から開始して増分します
- 複数回出現する要素の場合、各出現に対して増分された番号が付与されます
- 複数の配列パラメータがある場合、すべての配列は同じ長さでなければならず、そうでない場合はエラーが発生します。複数配列の対応する位置が結合されて要素ペアを形成し、番号の生成に使用されます
- 空の配列は空の配列を返し、NULL配列はNULLを返します
- 配列要素内のnull値について: null要素も対応する番号を生成します

**クエリ例:**

配列に対して一意の番号を生成します。複数回出現する要素の場合、各出現に対して増分された番号が付与されます:

```sql
SELECT array_enumerate_uniq([1, 2, 1, 3, 2, 1]);
+------------------------------------------+
| array_enumerate_uniq([1, 2, 1, 3, 2, 1]) |
+------------------------------------------+
| [1, 1, 2, 1, 2, 3]                       |
+------------------------------------------+
```
空の配列は空の配列を返します：

```sql
SELECT array_enumerate_uniq([]);
+----------------------+
| array_enumerate_uniq([]) |
+----------------------+
| []                   |
+----------------------+
```
NULL配列はNULLを返します：

```sql
SELECT array_enumerate_uniq(NULL), array_enumerate_uniq(NULL, NULL);
+----------------------------+----------------------------------+
| array_enumerate_uniq(NULL) | array_enumerate_uniq(NULL, NULL) |
+----------------------------+----------------------------------+
| NULL                       | NULL                             |
+----------------------------+----------------------------------+
```
null値を含む配列では、null要素も数値を生成します：

```sql
SELECT array_enumerate_uniq([1, null, 1, null, 1]);
+--------------------------------------------+
| array_enumerate_uniq([1, null, 1, null, 1]) |
+--------------------------------------------+
| [1, 1, 2, 2, 3]                            |
+--------------------------------------------+
```
複数の配列の組み合わせに基づいて数値を生成する、複数配列パラメータの例：

```sql
SELECT array_enumerate_uniq([1, 2, 1], [10, 20, 10]);
+----------------------------------------------+
| array_enumerate_uniq([1, 2, 1], [10, 20, 10]) |
+----------------------------------------------+
| [1, 1, 2]                                    |
+----------------------------------------------+
```
配列の長さが一致しない場合のエラー:

```sql
SELECT array_enumerate_uniq([1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lengths of all arrays of function array_enumerate_uniq must be equal.
```
IPタイプサポートの例：

```sql
SELECT array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+

mysql> SELECT array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+
```
複合型の例：

ネストした配列型はサポートされておらず、エラーになります：

```sql
SELECT array_enumerate_uniq([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<ARRAY<TINYINT>>, expression is array_enumerate_uniq([[1, 2], [3, 4], [5, 6]])
```
Map型はサポートされていません。エラーが発生します：

```sql
SELECT array_enumerate_uniq([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_enumerate_uniq([map('k', 1), map('k', 2), map('k', 3)])
```
パラメータ数が間違っている場合のエラー:

```sql
SELECT array_enumerate_uniq();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate_uniq' which has 0 arity. Candidate functions are: [array_enumerate_uniq(Expression, Expression...)]
```
非配列型を渡した際のエラー:

```sql
SELECT array_enumerate_uniq('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate_uniq(VARCHAR(12))
```
### キーワード

ARRAY, ENUMERATE, UNIQ, ARRAY_ENUMERATE_UNIQ
