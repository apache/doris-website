---
{
  "title": "ARRAY_FIRST",
  "language": "ja",
  "description": "ラムダ式の条件を満たす配列内の最初の要素を返します。"
}
---
## array_first

<version since="2.0.0">

</version>

### 説明

lambda式の条件を満たす配列内の最初の要素を返します。この関数は配列の要素にlambda式を適用し、条件を満たす最初の要素を見つけて返します。

### 構文

```sql
array_first(lambda, array1, ...)
```
### パラメータ

- `lambda`：配列要素を評価するために使用されるlambda式、true/falseまたはブール値に変換可能な式を返す
- `array1, ...`：1つ以上のARRAY<T>型パラメータ

**Tでサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付と時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- ブール型：BOOLEAN
- IP型：IPV4、IPV6
- 複合データ型：ARRAY、MAP、STRUCT

### 戻り値

戻り値の型：T

戻り値の意味：
- lambda式の条件を満たす配列内の最初の要素を返す
- NULL：配列が空の場合、または条件を満たす要素が存在しない場合

使用上の注意：
- lambda式のパラメータ数は配列パラメータの数と一致している必要がある
- すべての入力配列は同じ長さである必要がある
- 多次元配列と複合型配列での検索をサポート
- 空の配列はNULLを返す
- NULL入力パラメータはサポートしない
- lambdaは任意のスカラー式を使用できるが、集計関数は使用できない
- lambda式は他の高階関数を呼び出すことができるが、戻り値の型は互換性がある必要がある
- 配列要素内のnull値について：null要素は処理のためlambda式に渡され、lambdaはnull値をチェックできる

**クエリ例：**

浮動小数点配列で3以上の最初の要素を見つける：

```sql
SELECT array_first(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+-----------------------------------------------------+
| array_first(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-----------------------------------------------------+
|                                                 3.3 |
+-----------------------------------------------------+
```
文字列配列で長さが2より大きい最初の要素を検索する:

```sql
SELECT array_first(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+----------------------------------------------------------------------+
| array_first(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+----------------------------------------------------------------------+
| ccc                                                                  |
+----------------------------------------------------------------------+
```
空の配列はNULLを返します：

```sql
SELECT array_first(x -> x > 0, []);
+-------------------------------------+
| array_first(x -> x > 0, [])        |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```
NULL入力パラメータはエラーになります:

```sql
SELECT array_first(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL

SELECT array_first(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_first', expression: array_first(NULL), The 1st arg of array_filter must be lambda but is NULL
```
null値を含む配列では、ラムダでnullをチェックできます：

```sql
SELECT array_first(x -> x is not null, [null, 1, null, 3, null, 5]);
+--------------------------------------------------------------+
| array_first(x -> x is not null, [null, 1, null, 3, null, 5]) |
+--------------------------------------------------------------+
|                                                            1 |
+--------------------------------------------------------------+
```
マルチ配列検索で、最初の配列が2番目の配列より大きい最初の要素を見つける:

```sql
SELECT array_first((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------------------------------+
| array_first((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------------------------------+
|                                                                     NULL |
+--------------------------------------------------------------------------+
```
複合型の例:

ネストされた配列の検索、長さが2より大きい最初のサブ配列を見つける:

```sql
SELECT array_first(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+---------------------------------------------------------------+
| array_first(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+---------------------------------------------------------------+
| [3, 4, 5]                                                     |
+---------------------------------------------------------------+
```
Map型の検索で、キー'a'の値が10より大きい最初の要素を見つける：

```sql
SELECT array_first(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_first(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| {"a":15}                                                      |
+---------------------------------------------------------------+
```
パラメータ数が間違っている場合のエラー:

```sql
SELECT array_first(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```
lambda式のパラメータ数が配列パラメータ数と一致しない場合のエラー:

```sql
SELECT array_first((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```
非配列型を渡した際のエラー:

```sql
SELECT array_first(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```
### キーワード

ARRAY, FIRST, ARRAY_FIRST
