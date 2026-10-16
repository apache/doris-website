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

条件に基づいて配列の要素をフィルタリングし、条件を満たす要素からなる新しい配列を返します。ラムダ式を使う高階関数形式と、真偽値の配列を直接使う形式の二通りの呼び出し方があります。

## 構文

```sql
array_filter(lambda, array1, ...)
array_filter(array1, array<boolean> filter_array)
```

### 引数

- `lambda`：配列の要素を評価するラムダ式。true/false、または真偽値に変換できる式を返します。
- `array1, ...`：一つ以上の ARRAY\<T> 型の引数。
- `filter_array`：ARRAY\<BOOLEAN> 型。フィルタリングに使用する真偽値の配列です。

**T に使用できる型：**
- 数値型：TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型：CHAR, VARCHAR, STRING
- 日付・時刻型：DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 真偽値型：BOOLEAN
- IP 型：IPV4, IPV6
- UUID：[UUID](../../../basic-element/sql-data-types/uuid.md)
- 複合データ型：ARRAY, MAP, STRUCT

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- フィルタリング条件を満たすすべての要素からなる新しい配列を返します。
- NULL：入力配列が NULL の場合。
- 空の配列：条件を満たす要素がない場合。

使用上の注意：
- ラムダ形式：ラムダ式の引数の数は、配列の引数の数と一致する必要があります。
- 真偽値配列形式：`array1` と `filter_array` の長さは一致させることを推奨します。真偽値の配列のほうが長い場合、余分な値は無視されます。短い場合、真偽値の配列に対応する位置の要素だけが処理されます。
- 複数の配列や複合型の配列のフィルタリングをサポートします。
- 空の配列を入力すると空の配列を返し、NULL の配列を入力すると NULL を返します。
- ラムダ式では任意のスカラー式を使用できますが、集約関数は使用できません。
- ラムダ式からほかの高階関数を呼び出せますが、互換性のある型を返す必要があります。
- 配列内の NULL 要素も処理のためにラムダ式に渡されます。ラムダ式で NULL 値を評価できます。

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

**クエリの例：**

ラムダ式を使用して、double_array から 3 以上の要素を抽出します：
```sql
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```

ラムダ式を使用して、string_array から長さが 2 を超える要素を抽出します：
```sql
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+--------------------------------------------------+
```

真偽値の配列を使用して要素をフィルタリングします：
```sql
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```

真偽値の配列を使い、対応する位置の要素を残すかどうかを決める例：

```sql
SELECT array_filter([1,2,3], [true, false, true]);
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```

真偽値の配列が元の配列より長い場合、余分な真偽値は無視されます：
```sql
SELECT array_filter([1,2,3], [true, false, true, false]);
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```

真偽値の配列が元の配列より短い場合、対応する位置の要素だけが処理されます：
```sql
SELECT array_filter([1,2,3], [true, false]);
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```

空の配列を入力すると空の配列を返します：
```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

NULL の配列を入力すると、エラーを発生させずに NULL を返します：
```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

NULL 値を含む配列では、ラムダ式で NULL を評価できます：
```sql
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```

複数の配列を使用し、int_array > double_array を満たす要素を抽出します：
```sql
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```

複合型の例：

ネストした配列から、各サブ配列の長さが 2 を超える要素を抽出します：
```sql
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```

MAP 型の配列から、キー 'a' の値が 10 を超える要素を抽出します：
```sql
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```

STRUCT 型の配列から、age が 18 を超える要素を抽出します：
```sql
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

引数の数が正しくない場合：
```sql
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

配列の長さが一致しない場合はエラーになります：
```sql
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

配列以外の型を渡すとエラーになります：
```sql
SELECT array_filter(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```


**高階関数をネストする例：**

**正しい例：ラムダ式内でスカラー値を返す高階関数を呼び出す**

この例では、内側の array_count がスカラー値（INT64）を返し、array_filter が処理できるため、ネストできます。
```sql
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```

**エラーの例：ラムダ式が配列型を返す**

この例では、内側の array_exists が ARRAY<BOOLEAN> を返す一方、外側の array_filter はラムダ式がスカラー値を返すことを想定しているため、ネストできません。
```sql
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```

### キーワード

ARRAY, FILTER, ARRAY_FILTER
