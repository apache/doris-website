---
{
  "title": "ARRAY_FILTER",
  "language": "ja",
  "description": "条件に基づいて配列要素をフィルタリングし、条件を満たす要素で構成された新しい配列を返します。"
}
---
## array_filter

<version since="2.0.0">

</version>

## 説明

条件に基づいて配列要素をフィルタリングし、条件を満たす要素で構成された新しい配列を返します。この関数は2つの呼び出し方法をサポートしています：lambda式を使用する高階関数形式と、boolean配列を直接使用するフィルタリング形式です。

## 構文

```sql
array_filter(lambda, array1, ...)
array_filter(array1, array<boolean> filter_array)
```
### パラメータ

- `lambda`：配列要素を評価するために使用されるlambda式、true/falseまたはboolean値に変換可能な式を返す
- `array1, ...`：1つ以上のARRAY\<T>型パラメータ
- `filter_array`：ARRAY\<BOOLEAN>型、フィルタリングに使用されるboolean配列

**T サポート型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日時型: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean型: BOOLEAN
- IP型: IPV4, IPV6
- 複合データ型: ARRAY, MAP, STRUCT

### 戻り値

戻り値の型: ARRAY\<T>

戻り値の意味:
- フィルタリング条件を満たすすべての要素で構成された新しい配列を返す
- NULL: 入力配列がNULLの場合
- 空の配列: 条件を満たす要素がない場合

使用上の注意:
- Lambda形式: lambda式のパラメータ数は配列パラメータ数と一致する必要がある
- Boolean配列形式: `array1`と`filter_array`の長さは理想的には完全に一致する必要がある。boolean配列が長い場合、余分なboolean値は無視される；boolean配列が短い場合、boolean配列の対応する位置の要素のみが処理される
- 複数配列および複合型配列のフィルタリングをサポート
- 空の配列は空の配列を返し、NULL配列はNULLを返す
- Lambdaは任意のスカラー式を使用でき、集約関数は使用できない
- Lambda式は他の高階関数を呼び出すことができるが、互換性のある型を返す必要がある
- 配列要素内のnull値について: null要素はlambda式に渡されて処理され、lambdaはnull値を評価できる

### 例

```sql
CREATE TABLE array_filter_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_filter_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['x', 'yy', 'zzz']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```
**クエリの例:**

double_array内の3以上の要素をフィルタリングするためのラムダ式の使用:

```sql
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```
長さが2より大きいstring_array内の要素をフィルタリングするためのラムダ式の使用:

```sql
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+------------------------------------------+
```
boolean配列を使用して要素をフィルタリングする:

```sql
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```
Boolean配列フィルタリングの例、boolean値に基づいて対応する位置の要素を保持するかどうかを決定する：

```sql
SELECT array_filter([1,2,3], [true, false, true]);
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```
boolean配列の長さが元の配列より大きい場合、余分なboolean値は無視されます：

```sql
SELECT array_filter([1,2,3], [true, false, true, false]);
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```
boolean配列の長さが元の配列より短い場合、boolean配列の対応する位置の要素のみが処理されます：

```sql
SELECT array_filter([1,2,3], [true, false]);
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```
空の配列は空の配列を返します：

```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```
NULL配列はNULLを返す: 入力配列がNULLの場合、エラーをスローせずにNULLを返します。

```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```
null値を含む配列、lambdaはnullを評価できます：

```sql
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```
複数配列のフィルタリング、int_array > double_arrayの要素をフィルタリング：

```sql
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```
複合型の例：

ネストした配列のフィルタリング、各サブ配列の長さが2より大きい要素をフィルタリング：

```sql
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```
Map型のフィルタリング、キー'a'の値が10より大きい要素をフィルタリングする場合:

```sql
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```
構造体型のフィルタリング、ageが18より大きい要素をフィルタリング：

```sql
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
パラメータの数が正しくありません:

```sql
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```
配列の長さが一致しない場合、エラーが発生します：

```sql
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```
非配列型を渡すとエラーが発生します：

```sql
SELECT array_filter(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```
**ネストされた高階関数の例：**

**正しい例：lambdaでスカラーを返す高階関数の呼び出し**

現在の例では、内側のarray_countがスカラー値（INT64）を返すため、ネストすることができ、array_filterで処理することができます。

```sql
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```
**エラー例: lambdaが配列型を返す**

現在の例では、内側のarray_existsがARRAY<BOOLEAN>を返すのに対し、外側のarray_filterはlambdaがスカラー値を返すことを期待するため、ネストできません

```sql
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```
### キーワード

ARRAY, FILTER, ARRAY_FILTER
