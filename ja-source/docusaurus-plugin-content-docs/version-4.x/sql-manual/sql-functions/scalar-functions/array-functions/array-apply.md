---
{
  "title": "ARRAY_APPLY",
  "description": "<version since=\"1.2.3\">",
  "language": "ja"
}
---
## array_apply

<version since="1.2.3">


</version>

## デスクリプション

指定されたバイナリ演算子を使用して配列要素をフィルタリングし、条件を満たす要素を含む新しい配列を返します。これはlambda式の代わりに事前定義された演算子を使用する簡素化された配列フィルタリング関数です。

## Syntax

```sql
array_apply(arr, op, val)
```
### パラメータ

- `arr`：ARRAY\<T> 型、フィルタリング対象の配列
- `op`：STRING 型、フィルタリング条件の演算子、定数値である必要があります。サポートされる演算子：`=`、`!=`、`>`、`>=`、`<`、`<=`
- `val`：T 型、フィルタリング条件の値、定数値である必要があります

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 論理型：BOOLEAN

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- フィルタリング条件を満たすすべての要素を含む新しい配列を返します
- NULL：入力配列がNULLまたは条件値がNULLの場合
- 空配列：条件を満たす要素がない場合

使用上の注意：
- 演算子と条件値は定数である必要があり、列名や式は使用できません
- サポートされる型は限定的で、主に数値型、日付型、論理型です
- 空配列は空配列を返し、NULL配列はNULLを返します
- 配列要素内のnull値について：null要素はフィルタリングされ、比較演算に参加しません

### 例

```sql
CREATE TABLE array_apply_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    date_array ARRAY<DATE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_apply_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['2023-02-01', '2023-02-02', '2023-02-03']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```
**クエリの例:**

double_array内で2より大きい要素をフィルタリングする：

```sql
SELECT array_apply(double_array, ">", 2) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(double_array, '>', 2)        |
+------------------------------------------+
| [2.2, 3.3, 4.4, 5.5]                     |
+------------------------------------------+
```
int_array内で3と等しくない要素をフィルタリングする：

```sql
SELECT array_apply(int_array, "!=", 3) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(int_array, '!=', 3)          |
+------------------------------------------+
| [1, 2, 4, 5]                             |
+------------------------------------------+
```
date_array内で指定された日付以上の要素をフィルタします：

```sql
SELECT array_apply(date_array, ">=", '2023-01-03') FROM array_apply_test WHERE id = 1;
+---------------------------------------------+
| array_apply(date_array, ">=", '2023-01-03') |
+---------------------------------------------+
| ["2023-01-03", "2023-01-04", "2023-01-05"]  |
+---------------------------------------------+
```
空の配列は空の配列を返します：

```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 3;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| []                                        |
+------------------------------------------+
```
NULL配列はNULLを返す：入力配列がNULLの場合、エラーを投げることなくNULLを返します。

```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 4;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| NULL                                      |
+------------------------------------------+
```
null値を含む配列では、null要素はフィルタリングされます：

```sql
SELECT array_apply([1, null, 3, null, 5], ">", 2);
+------------------------------------------+
| array_apply([1, null, 3, null, 5], '>', 2) |
+------------------------------------------+
| [3, 5]                                   |
+------------------------------------------+
```
### Exception Examples

サポートされていないオペレーター：

```sql
SELECT array_apply([1,2,3], "like", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], 'like', 2), array_apply(arr, op, val): op support =, >=, <=, >, <, !=, but we get like
```
サポートされていない文字列型:

```sql
SELECT array_apply(['a','b','c'], "=", 'a');
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type VARCHAR(1), expression is array_apply(['a', 'b', 'c'], '=', 'a')
```
サポートされていない複合型:

```sql
SELECT array_apply([[1,2],[3,4]], "=", [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type ARRAY<TINYINT>, expression is array_apply([[1, 2], [3, 4]], '=', [1, 2])
```
Operatorは定数ではありません:

```sql
SELECT array_apply([1,2,3], concat('>', '='), 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], concat('>', '='), 2), array_apply(arr, op, val): op support const value only.
```
条件値が定数ではありません：

```sql
SELECT array_apply([1,2,3], ">", id) FROM array_apply_test WHERE id = 1;
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], '>', id), array_apply(arr, op, val): val support const value only.
```
パラメータの数が正しくありません:

```sql
SELECT array_apply([1,2,3], ">");
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_apply' which has 2 arity. Candidate functions are: [array_apply(Expression, Expression, Expression)]
```
非配列型の渡し方：

```sql
SELECT array_apply('not_an_array', ">", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```
### キーワード

ARRAY, APPLY, ARRAY_APPLY
