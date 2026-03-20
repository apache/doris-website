---
{
  "title": "ARRAY_CUM_SUM",
  "language": "ja"
}
---
## array_cum_sum

<version since="2.0.0">

</version>

## 説明

配列の累積和を計算します。この関数は配列を左から右へ走査し、先頭から現在位置まで（現在位置を含む）のすべての要素の和を計算し、元の配列と同じ長さの新しい配列を返します。

## 構文

```sql
array_cum_sum(ARRAY<T> arr)
```
### パラメータ

- `arr`：ARRAY\<T> 型、累積和を計算する配列。列名または定数値をサポートします。

**T サポート型:**
  - 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT，FLOAT, DOUBLE，DECIMAL

### 戻り値

戻り値の型: ARRAY\<T>

戻り値の意味:

- 入力配列と同じ長さの新しい配列を返します。各位置には元の配列の先頭から現在位置までの全要素の和が含まれます
- NULL: 入力配列がNULLの場合

使用上の注意:
- 配列に他の型（文字列など）が含まれている場合、要素をDOUBLE型に変換を試みます。変換に失敗した要素はnullになります。
- この関数は全ての要素を互換性のある数値型に変換して累積和計算を試みます。累積和の戻り値の型は入力型に基づいて自動的に選択されます:
  - 入力がDOUBLEまたはFLOATの場合、ARRAY\<DOUBLE>を返します
  - 入力が整数型の場合、ARRAY\<BIGINT>またはARRAY\<LARGEINT>を返します
  - 入力がDECIMALの場合、ARRAY\<DECIMAL>を返し、元の精度とスケールを維持します
- 累積和の計算順序は左から右で、各位置にはその前の全ての非null要素の和が含まれます。
- 空配列は空配列を返し、NULL配列はNULLを返し、要素が1つだけの配列は元の配列を返します。
- ネストした配列、MAP、STRUCTおよびその他の複合型は累積和をサポートしません。呼び出すとエラーになります。
- 配列要素のnull値について: 最初の非null値から開始し、累積値の後のnullは0として累積和計算に参加します。

### Examples

```sql
CREATE TABLE array_cum_sum_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_cum_sum_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]),
(2, [10, 20, 30], [10.5, 20.5, 30.5]),
(3, [], []),
(4, NULL, NULL);
```
**クエリ例:**

int_arrayの累積和: 各位置には、開始位置から現在の位置まで（現在の位置を含む）のすべての要素の合計が格納されます。

```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 1;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| [1, 3, 6, 10, 15]           |
+-----------------------------+
```
double_arrayの累積和：浮動小数点配列の累積和で、結果は浮動小数点になります。

2番目の位置の結果が3.3000000000000003になっていることに注目してください。これは浮動小数点のバイナリ表現精度によって生じる小さな誤差が原因です。1.1と2.2はバイナリ浮動小数点（IEEE 754 double）では正確に表現できず、近似値でのみ格納されます。これらを加算すると誤差が蓄積され、3.3000000000000003になります。その後の累積和（6.6、11、16.5など）は「正常な値」のように見えるかもしれませんが、実際には近似値であり、丸め処理後に小数点以下が一致しているだけです。これはIEEE 754浮動小数点に基づくすべてのシステム（MySQL、Snowflake、Python、JavaScriptなどを含む）で発生する現象です。

```sql
SELECT array_cum_sum(double_array) FROM array_cum_sum_test WHERE id = 1;
+------------------------------------------+
| array_cum_sum(double_array)              |
+------------------------------------------+
| [1.1, 3.3000000000000003, 6.6, 11, 16.5] |
+------------------------------------------+
```
文字列と数値を混在させる場合、数値に変換できる要素は累積和に参加し、変換できない要素はnullになり、そのnull値は累積和の計算において0として扱われます。

```sql
SELECT array_cum_sum(['a', 1, 'b', 2, 'c', 3]);
+-----------------------------------------+
| array_cum_sum(['a', 1, 'b', 2, 'c', 3]) |
+-----------------------------------------+
| [0, 1, 1, 3, 3, 6]                      |
+-----------------------------------------+
```
空の配列は空の配列を返します：

```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 3;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| []                          |
+-----------------------------+
```
NULL配列はNULLを返す：入力配列がNULLの場合、エラーをスローすることなくNULLを返します。

```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 4;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```
要素が1つだけの配列は元の配列を返します：

```sql
SELECT array_cum_sum([42]);
+----------------------+
| array_cum_sum([42])  |
+----------------------+
| [42]                 |
+----------------------+
```
nullが含まれる配列において、最初の非null値から開始して、累積値の後のnullは0として扱われて累積和の計算に参加します。

```sql
SELECT array_cum_sum([null, 1, null, 3, null, 5]);
+--------------------------------------------+
| array_cum_sum([null, 1, null, 3, null, 5]) |
+--------------------------------------------+
| [null, 1, 1, 4, 4, 9]                      |
+--------------------------------------------+
```
複合型の例：

ネストされた配列型はサポートされていないため、エラーがスローされます。

```sql
SELECT array_cum_sum([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<ARRAY<TINYINT>>)
```
Mapタイプはサポートされていません。エラーをスローします。

```sql
SELECT array_cum_sum([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```
構造体型はサポートされていないため、エラーが発生します。

```sql
SELECT array_cum_sum(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```
パラメータの数が正しくない場合、エラーが発生します。

```sql
SELECT array_cum_sum([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_cum_sum' which has 2 arity. Candidate functions are: [array_cum_sum(Expression)]
```
非配列型を渡すとエラーが発生します。

```sql
SELECT array_cum_sum('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(VARCHAR(12))
```
### キーワード

ARRAY, CUM, SUM, CUM_SUM, ARRAY_CUM_SUM
