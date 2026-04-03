---
{
  "title": "ARRAY_COUNT",
  "language": "ja"
}
---
## array_count

<version since="2.0.0">



## 説明

配列の要素にラムダ式を適用し、戻り値が0でない要素の数をカウントします。

## 構文

```sql
array_count(lambda, array1, ...)
```
### パラメータ

- `lambda`：配列要素を評価・計算するために使用されるlambda式
- `array1, ...`：1つ以上のARRAY\<T>型パラメータ

**T でサポートされる型：**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付・時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- ブール型: BOOLEAN
- IP型: IPV4, IPV6
- 複合データ型: ARRAY, MAP, STRUCT

### 戻り値

戻り値の型: BIGINT

戻り値の意味:
- lambda式の結果がtrueとなる要素の数を返す
- 0: 条件を満たす要素がない場合、または入力配列がNULLの場合

使用上の注意:
- lambda式のパラメータ数は配列パラメータの数と一致する必要がある
- すべての入力配列は同じ長さでなければならない
- 複数の配列と複合型配列での集計をサポート
- 空配列は0を返し、NULL配列は0を返す
- Lambda式は他の高階関数を呼び出すことができるが、戻り値の型に互換性が必要
- 配列要素のnull値について: null要素はlambda式に渡されて処理され、lambdaはnull値を評価できる

### 例

```sql
CREATE TABLE array_count_test (
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

INSERT INTO array_count_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['a', null, 'ccc', null, 'eeeee']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```
**クエリ例：**

2より大きいint_array内の要素数をカウント：

```sql
SELECT array_count(x -> x > 2, int_array) FROM array_count_test WHERE id = 1;
+-------------------------------------+
| array_count(x -> x > 2, int_array)  |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```
double_array内で3以上の要素をカウントする:

```sql
SELECT array_count(x -> x >= 3, double_array) FROM array_count_test WHERE id = 1;
+------------------------------------------+
| array_count(x -> x >= 3, double_array)   |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```
string_array内で長さが2より大きい要素をカウントする：

```sql
SELECT array_count(x -> length(x) > 2, string_array) FROM array_count_test WHERE id = 1;
+--------------------------------------------------+
| array_count(x -> length(x) > 2, string_array)    |
+--------------------------------------------------+
|                                              3   |
+--------------------------------------------------+
```
空の配列の計算について：

```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 3;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```
NULL配列計算の場合:

```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 4;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```
null値を含む配列内のnull要素をカウントする：

```sql
SELECT array_count(x -> x is null, int_array) FROM array_count_test WHERE id = 2;
+------------------------------------------+
| array_count(x -> x is null, int_array)   |
+------------------------------------------+
|                                        2 |
+------------------------------------------+
```
null値を含む配列内の非null要素をカウントする:

```sql
SELECT array_count(x -> x is not null, int_array) FROM array_count_test WHERE id = 2;
+----------------------------------------------+
| array_count(x -> x is not null, int_array)   |
+----------------------------------------------+
|                                            3 |
+----------------------------------------------+
```
複数配列パラメータの例:

```sql
SELECT array_count((x, y) -> x > y, [1, 2, 3], [0, 3, 2]);
+--------------------------------------------------+
| array_count((x, y) -> x > y, [1, 2, 3], [0, 3, 2]) |
+--------------------------------------------------+
|                                              2   |
+--------------------------------------------------+
```
複合型の例 - 2つ以上の要素を持つ配列をカウント:

```sql
SELECT array_count(x -> array_length(x) > 2, [[1,2],[1,2,3],[4,5,6,7]]);
+--------------------------------------------------+
| array_count(x -> array_length(x) > 2, [[1,2],[1,2,3],[4,5,6,7]]) |
+--------------------------------------------------+
|                                              2   |
+--------------------------------------------------+
```
ネストされた高階関数の例 - 5より大きい要素を含む配列をカウントする:

```sql
SELECT array_count(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6],[7,8,9]]);
+--------------------------------------------------+
| array_count(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6],[7,8,9]]) |
+--------------------------------------------------+
|                                              2   |
+--------------------------------------------------+
```
リテラル配列の例:

```sql
SELECT array_count(x -> x % 2 = 0, [1, 2, 3, 4, 5, 6]);
+------------------------------------------+
| array_count(x -> x % 2 = 0, [1, 2, 3, 4, 5, 6]) |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```
### キーワード

ARRAY、COUNT、ARRAY_COUNT
