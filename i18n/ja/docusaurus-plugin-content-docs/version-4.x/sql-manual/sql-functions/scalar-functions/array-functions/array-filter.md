---
{
    "title": "ARRAY_FILTER",
    "language": "ja",
    "description": "条件に基づいて配列の要素をフィルタリングし、条件を満たす要素からなる新しい配列を返します。"
}
---

## array_filter

<version since="2.0.0">

</version>

## 説明

条件に基づいて配列の要素をフィルタリングし、条件を満たす要素からなる新しい配列を返します。この関数には、ラムダ式を使う高階関数形式と、真偽値の配列を直接使うフィルタリング形式の二つの呼び出し方法があります。

## 構文

```sql
array_filter(lambda, array1, ...)
array_filter(array1, array<boolean> filter_array)
```

### パラメータ

- `lambda`：配列の要素を評価するラムダ式。true/false、または真偽値に変換できる式を返します
- `array1, ...`：一つ以上の ARRAY\<T> 型の引数
- `filter_array`：ARRAY\<BOOLEAN> 型。フィルタリングに使う真偽値の配列

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- 複合データ型：ARRAY、MAP、STRUCT

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- フィルタリング条件を満たす全要素からなる新しい配列を返します
- NULL：入力配列が NULL の場合
- 空の配列：条件を満たす要素がない場合

使用上の注意：
- ラムダ式形式では、ラムダ式のパラメータ数と配列引数の数を一致させる必要があります
- 真偽値配列形式では、`array1` と `filter_array` の長さを一致させることが望まれます。真偽値の配列が長い場合、余分な真偽値は無視されます。短い場合、その配列に対応する位置の要素だけが処理されます
- 複数の配列や複合型の配列のフィルタリングをサポートします
- 空の配列を入力すると空の配列を、NULL の配列を入力すると NULL を返します
- ラムダ式では任意のスカラー式を使用できますが、集約関数は使用できません
- ラムダ式から他の高階関数を呼び出すこともできますが、互換性のある型を返す必要があります
- 配列内の NULL 要素はラムダ式に渡され、ラムダ式で NULL 値を評価できます

### 使用例

**準備** — 通常のケース、境界ケース、空配列、NULL のケースを含む 4 行のテスト用テーブルを作成してデータを挿入します。以降の例はすべてこのテーブルを参照します。

```sql {setup}
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

**例 1** — DOUBLE 配列の列にラムダ式を適用し、`>= 3` の要素を残します。

```sql {example="1"}
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
```

```result {example="1"}
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```

**例 2** — STRING 配列の列にラムダ式を適用し、`length > 2` の要素を残します。

```sql {example="2"}
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
```

```result {example="2"}
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+--------------------------------------------------+
```

**例 3** — 真偽値マスク形式で、マスクが `true` の位置にある要素を残します。

```sql {example="3"}
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
```

```result {example="3"}
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```

**例 4** — 配列リテラルを使う真偽値マスク形式です。

```sql {example="4"}
SELECT array_filter([1,2,3], [true, false, true]);
```

```result {example="4"}
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```

**例 5** — 真偽値の配列が値の配列より長い場合、余分なマスク要素は無視されます。

```sql {example="5"}
SELECT array_filter([1,2,3], [true, false, true, false]);
```

```result {example="5"}
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```

**例 6** — 真偽値の配列が値の配列より短い場合、マスクに対応する位置だけが処理されます。

```sql {example="6"}
SELECT array_filter([1,2,3], [true, false]);
```

```result {example="6"}
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```

**例 7** — 入力が空の配列の場合、空の配列を返します（`id = 3` の行）。

```sql {example="7"}
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
```

```result {example="7"}
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

**例 8** — 入力配列が NULL の場合、NULL を返します（`id = 4` の行）。

```sql {example="8"}
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
```

```result {example="8"}
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

**例 9** — NULL 要素を含む配列では、ラムダ式で `IS NOT NULL` を判定して NULL 要素を除外できます。

```sql {example="9"}
SELECT array_filter(x -> x is not null, [null, 1, null, 2, null]);
```

```result {example="9"}
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```

**例 10** — テスト用テーブルの二つの配列に、複数引数のラムダ式を適用します。

```sql {example="10"}
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
```

```result {example="10"}
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```

**例 11** — ネストした配列リテラルをフィルタリングし、`size > 2` の部分配列を残します。

```sql {example="11"}
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
```

```result {example="11"}
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```

**例 12** — MAP の配列をフィルタリングし、`x['a'] > 10` の要素を残します。

```sql {example="12"}
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
```

```result {example="12"}
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```

**例 13** — STRUCT の配列をフィールドの値でフィルタリングします。

```sql {example="13"}
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
```

```result {example="13"}
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

**例 14** — ラムダ式のパラメータ数は、渡す配列の数と一致させる必要があります。

```sql {example="14"}
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
```

```error {example="14"}
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

**例 15** — 複数配列形式では、入力配列の長さをすべて一致させる必要があります。

```sql {example="15"}
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
```

```error {example="15"}
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

**例 16** — 最初の引数は配列でなければなりません。

```sql {example="16"}
SELECT array_filter(x -> x > 0, 'not_an_array');
```

```error {example="16"}
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

**例 17** — ネストした高階関数の例です。内側の `array_count` が返すスカラー値を、外側の `array_filter` のラムダ式で使用します。

```sql {example="17"}
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
```

```result {example="17"}
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```

**例 18** — 反例です。外側の `array_filter` のラムダ式は配列を返せません（ここでは `array_exists` がスカラー値ではなく ARRAY<BOOLEAN> を返します）。

```sql {example="18"}
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
```

```error {example="18"}
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```

### キーワード

ARRAY, FILTER, ARRAY_FILTER 
