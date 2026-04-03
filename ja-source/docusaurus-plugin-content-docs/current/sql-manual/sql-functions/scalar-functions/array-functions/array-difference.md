---
{
  "title": "ARRAY_DIFFERENCE",
  "language": "ja",
  "description": "配列内の隣接する要素間の差を計算します。この関数は配列を左から右に走査し、"
}
---
## array_difference

<version since="2.0.0">

</version>

## 説明

配列内の隣接する要素間の差を計算します。この関数は配列を左から右に走査し、各要素とその前の要素との差を計算し、元の配列と同じ長さの新しい配列を返します。最初の要素の差は常に0です。

## 構文

```sql
array_difference(ARRAY<T> arr)
```
### パラメータ

- `arr`：ARRAY\<T> 型、差分を計算する配列。カラム名または定数値をサポートします。

**T サポートされる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL

### 戻り値

戻り値の型: ARRAY\<T>

戻り値の意味:
- 入力配列と同じ長さの新しい配列を返します。各位置には現在の要素と前の要素の差分が含まれ、最初の要素の差分は0になります
- NULL: 入力配列がNULLの場合

使用上の注意:
- 配列に他の型（文字列など）が含まれている場合、要素をDOUBLE型に変換を試みます。変換に失敗した要素はnullになり、差分計算に参加しません。
- この関数は、すべての要素を互換性のある数値型に変換して差分計算を試み、差分の戻り値型は入力型に基づいて自動的に選択されます：
  - 入力がDOUBLEまたはFLOATの場合、ARRAY\<DOUBLE>を返します
  - 入力が整数型の場合、ARRAY\<BIGINT>またはARRAY\<LARGEINT>を返します
  - 入力がDECIMALの場合、ARRAY\<DECIMAL>を返し、元の精度とスケールを維持します
- 差分計算の順序は左から右で、各位置には現在の要素と前の要素の差分が含まれ、最初の要素は0になります。
- 空の配列は空の配列を返し、NULL配列はNULLを返し、要素が1つだけの配列は[0]を返します。
- 複合型（ネストされた配列、MAP、STRUCT）は差分計算をサポートしておらず、呼び出すとエラーになります。
- 配列要素内のnull値について: null要素は後続の差分計算に影響し、前の要素がnullの場合、現在の差分はnullになります

### 例

```sql
CREATE TABLE array_difference_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_difference_test VALUES
(1, [1, 3, 6, 10, 15], [1.1, 3.3, 6.6, 11.0, 16.5]),
(2, [10, 30, 60], [10.5, 41.0, 76.5]),
(3, [], []),
(4, NULL, NULL);
```
**クエリ例:**

int_arrayの差分: 各位置には現在の要素と前の要素の差が含まれ、最初の要素は0になります。

```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 1;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| [0, 2, 3, 4, 5]             |
+-----------------------------+
```
double_arrayの差分: 浮動小数点配列の差分、結果は浮動小数点です。

2番目の位置の結果が2.1999999999999997になっていることに注意してください。これは浮動小数点のバイナリ表現精度による小さな誤差が原因です（3.3 - 1.1はバイナリでは2.2として正確に表現できません）。続く値3.3、4.4、5.5は「正常な値」として表示されていますが、実際にはバイナリ近似値であり、丸め処理後に10進数と一致しているだけです。これはIEEE 754浮動小数点に基づくすべてのシステム（MySQL、Snowflake、Python、JavaScriptなどを含む）で発生する現象です。

```sql
SELECT array_difference(double_array) FROM array_difference_test WHERE id = 1;
+------------------------------------------+
| array_difference(double_array)           |
+------------------------------------------+
| [0, 2.1999999999999997, 3.3, 4.4, 5.5]  |
+------------------------------------------+
```
空の配列は空の配列を返します:

```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 3;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| []                          |
+-----------------------------+
```
NULL配列はNULLを返す: 入力配列がNULLの場合、エラーを発生させることなくNULLを返します。

```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 4;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```
要素が1つだけの配列は[0]を返します：

```sql
SELECT array_difference([42]);
+------------------------+
| array_difference([42]) |
+------------------------+
| [0]                    |
+------------------------+
```
null値を含む配列では、前の要素がnullの場合、現在の差分はnullになります。

```sql
SELECT array_difference([1, null, 3, null, 5]);
+-----------------------------------------+
| array_difference([1, null, 3, null, 5]) |
+-----------------------------------------+
| [0, null, null, null, null]             |
+-----------------------------------------+
```
文字列と数値を混合する場合、数値に変換できる要素は差分計算に参加し、変換できない要素はnullになり、対応する位置の結果もnullになります。

```sql
SELECT array_difference(['a', 1, 'b', 2, 'c', 3]);
+--------------------------------------------+
| array_difference(['a', 1, 'b', 2, 'c', 3]) |
+--------------------------------------------+
| [null, null, null, null, null, null]       |
+--------------------------------------------+
```
複合型の例：

ネストした配列型はサポートされていません。エラーが発生します。

```sql
SELECT array_difference([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<ARRAY<TINYINT>>)
```
Mapタイプがサポートされていません。エラーをスローします。

```sql
SELECT array_difference([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```
構造体型はサポートされていません。エラーがスローされます。

```sql
SELECT array_difference(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```
パラメータの数が正しくない場合、エラーが発生します。

```sql
SELECT array_difference([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_difference' which has 2 arity. Candidate functions are: [array_difference(Expression)]
```
非配列型を渡すとエラーが発生します。

```sql
SELECT array_difference('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(VARCHAR(12))
```
### キーワード

ARRAY、DIFFERENCE、ARRAY_DIFFERENCE
