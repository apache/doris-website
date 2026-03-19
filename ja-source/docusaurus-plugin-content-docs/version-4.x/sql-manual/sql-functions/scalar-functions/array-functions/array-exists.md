---
{
  "title": "ARRAY_EXISTS",
  "language": "ja"
}
---
## array_exists

<version since="2.0.0">

</version>

## デスクリプション

配列の要素にラムダ式を適用し、各要素が条件を満たすかどうかを示すブール配列を返します。この関数は配列内の各要素にラムダ式を適用し、対応するブール値を返します。

## Syntax

```sql
array_exists(lambda, array1, ...)
```
### パラメータ

- `lambda`：配列要素を評価するために使用されるlambda式。true/falseまたはboolean値に変換可能な式を返す
- `array1, ...`：1つ以上のARRAY<T>型パラメータ

**Tでサポートされる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- ブール型: BOOLEAN
- IP型: IPV4, IPV6
- 複合データ型: ARRAY, MAP, STRUCT

### 戻り値

戻り値の型: ARRAY<BOOLEAN>

戻り値の意味:
- 入力配列と同じ長さのboolean配列を返す。各位置には対応する要素にlambda式を適用した結果が格納される
- NULL: 配列パラメータのみがNULLでlambda式がない場合

使用上の注意:
- lambda式のパラメータ数は配列パラメータの数と一致する必要がある
- すべての入力配列は同じ長さでなければならない
- 多次元配列と複合型配列の評価をサポート
- 空配列は空配列を返す。配列パラメータのみがNULLでlambda式がない場合はNULLを返す。lambda式があり配列がNULLの場合はエラーになる
- lambdaは任意のスカラ式を使用できるが、集約関数は使用できない
- lambda式は他の高階関数を呼び出すことができるが、戻り値の型に互換性が必要
- 配列要素のnull値について: null要素はlambda式に渡されて処理され、lambdaでnull値をチェックできる

**クエリ例:**

浮動小数点配列の各要素が3以上かどうかをチェック:

```sql
SELECT array_exists(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------+
| array_exists(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------+
| [0, 0, 1, 1, 1]                                 |
+--------------------------------------------------+
```
文字列配列内の各要素の長さが2より大きいかどうかを確認する：

```sql
SELECT array_exists(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+--------------------------------------------------+
| array_exists(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+--------------------------------------------------+
| [0, 0, 1, 1, 1]                                 |
+--------------------------------------------------+
```
空の配列は空の配列を返します：

```sql
SELECT array_exists(x -> x > 0, []);
+-------------------------------------+
| array_exists(x -> x > 0, [])       |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```
NULL配列とlambda式の組み合わせ。NULLを含むlambda式がある場合、エラーになります。lambda式がない場合、NULLを返します：

```sql
SELECT array_exists(NULL);
+--------------------+
| array_exists(NULL) |
+--------------------+
| NULL               |
+--------------------+

SELECT array_exists(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL
```
null値を含む配列では、lambdaでnullをチェックできます：
nullとの比較演算（>、<、=、>=、<=など）は、特別なIS NULLやIS NOT NULL以外はnullを返します。これは、未知の値（NULL）が2より大きいかどうかを判断することが不可能だからです。この動作はMYSQL、POSTGRESSQLなどと一致しています。

```sql
SELECT array_exists(x -> x is not null, [1, null, 3, null, 5]);
+------------------------------------------+
| array_exists(x -> x is not null, [1, null, 3, null, 5]) |
+------------------------------------------+
| [1, 0, 1, 0, 1]                          |
+------------------------------------------+

SELECT array_exists(x -> x > 2, [1, null, 3, null, 5]);
+-------------------------------------------------+
| array_exists(x -> x > 2, [1, null, 3, null, 5]) |
+-------------------------------------------------+
| [0, null, 1, null, 1]                           |
+-------------------------------------------------+
```
多次元配列の評価では、最初の配列が2番目の配列より大きいかどうかを確認します：

```sql
SELECT array_exists((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------------+
| array_exists((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------------+
| [0, 0, 0, 0, 0]                                       |
+--------------------------------------------------------+
```
複合型の例：

ネストした配列の評価、各サブ配列の長さが2より大きいかどうかをチェック：

```sql
SELECT array_exists(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+----------------------------------------------------------------+
| array_exists(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+----------------------------------------------------------------+
| [0, 1, 0, 1]                                                   |
+----------------------------------------------------------------+
```
マップタイプの評価、キー'a'を持つ値が10より大きいかどうかをチェックする：

```sql
SELECT array_exists(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_exists(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [0, 1, 1]                                                     |
+---------------------------------------------------------------+
```
lambda式のパラメータ数が配列パラメータ数と一致しない場合のエラー:

```sql
SELECT array_exists(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```
配列長が一致しない場合のエラー:

```sql
SELECT array_exists((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```
非配列型を渡した際のエラー:

```sql
SELECT array_exists(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```
### Keywords

ARRAY、EXISTS、ARRAY_EXISTS
