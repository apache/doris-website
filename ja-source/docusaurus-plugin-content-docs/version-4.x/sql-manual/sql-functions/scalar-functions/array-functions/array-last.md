---
{
  "title": "ARRAY_LAST",
  "language": "ja"
}
---
## array_last

<version since="2.0.0">

</version>

## 説明

ラムダ式を満たす配列内の最後の要素を見つけます。条件を満たす最後の要素を見つけて返します。

## 構文

```sql
array_last(lambda, ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```
### パラメータ

- `lambda`：検索条件を定義するために使用されるlambda式
- `arr1, arr2, ...`：ARRAY<T>型、検索対象の配列。1つ以上の配列パラメータをサポート。

**Tでサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- Boolean型：BOOLEAN
- IP型：IPV4、IPV6
- 複合型：ARRAY、MAP、STRUCT

### 戻り値

戻り値の型：T

戻り値の意味：
- lambda式を満たす配列内の最後の要素を返す
- NULL：条件を満たす要素がない場合、または入力配列がNULLの場合

使用上の注意：
- lambda式のパラメータ数は配列パラメータの数と一致する必要がある
- 条件を満たす要素がない場合、NULLを返す
- NULL入力パラメータはサポートしない
- 複数の配列パラメータがある場合、すべての配列の長さが同じである必要がある
- Lambdaは任意のスカラー式を使用できるが、集約関数は使用できない
- Lambda式は他の高階関数を呼び出すことができるが、戻り値の型に互換性が必要
- 配列要素のnull値について：null要素はlambda式に渡されて処理され、lambdaはnull値をチェックできる

**クエリ例：**

浮動小数点配列で3以上の最後の要素を検索：

```sql
SELECT array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+----------------------------------------------------+
| array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+----------------------------------------------------+
|                                                5.5 |
+----------------------------------------------------+
```
文字列配列で長さが2より大きい最後の要素を見つける:

```sql
SELECT array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+---------------------------------------------------------------------+
| array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+---------------------------------------------------------------------+
| eeeee                                                               |
+---------------------------------------------------------------------+
```
空の配列はNULLを返します：

```sql
SELECT array_last(x -> x > 0, []);
+-------------------------------------+
| array_last(x -> x > 0, [])        |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```
NULL入力パラメータはエラーになります：

```sql
SELECT array_last(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL

SELECT array_last(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_last', expression: array_last(NULL), The 1st arg of array_filter must be lambda but is NULL
```
null値を含む配列では、lambdaでnullをチェックできます：

```sql
SELECT array_last(x -> x is not null, [null, 1, null, 3, null, 5]);
+-------------------------------------------------------------+
| array_last(x -> x is not null, [null, 1, null, 3, null, 5]) |
+-------------------------------------------------------------+
|                                                           5 |
+-------------------------------------------------------------+
```
マルチ配列検索で、最初の配列が2番目の配列より大きい最後の要素を見つける：

```sql
SELECT array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+-------------------------------------------------------------------------+
| array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```
ネストされた配列検索で、各サブ配列の長さが2より大きい最後の要素を見つける：

```sql
SELECT array_last(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+--------------------------------------------------------------+
| array_last(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+--------------------------------------------------------------+
| [7, 8, 9, 10]                                                |
+--------------------------------------------------------------+
```
パラメータ数が間違っている場合のエラー:

```sql
SELECT array_last();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_last' which has 0 arity. Candidate functions are: [array_last(Expression, Expression...)]
```
lambda式のパラメータ数が配列パラメータ数と一致しない場合のエラー:

```sql
SELECT array_last(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```
非配列型を渡した際のエラー:

```sql
SELECT array_last(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_last(Expression, VARCHAR(12))
```
### キーワード

ARRAY、LAST、ARRAY_LAST
