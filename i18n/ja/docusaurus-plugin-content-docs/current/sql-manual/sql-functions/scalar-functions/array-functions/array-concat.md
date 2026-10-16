---
{
    "title": "ARRAY_CONCAT",
    "language": "ja",
    "description": "入力されたすべての配列を一つの配列に連結します。一つ以上の配列を受け取り、引数の順序で連結した新しい配列を返します。"
}
---

## array_concat

<version since="2.0.0">


</version>

## 説明

入力されたすべての配列を一つの配列に連結します。一つ以上の配列を引数として受け取り、引数の順序で連結した新しい配列を返します。

## 構文

```sql
array_concat(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### パラメータ

- `arr1, arr2, ...`：ARRAY\<T> 型。連結する配列です。列名または定数値を指定できます。

**T でサポートされる型：**
- 数値型：TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型：CHAR, VARCHAR, STRING
- 日付時刻型：DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 真偽値型：BOOLEAN
- IP 型：IPV4, IPV6
- UUID：[UUID](../../../basic-element/sql-data-types/uuid.md)
- 複合データ型：ARRAY, MAP, STRUCT

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- 入力配列のすべての要素を元の順序のまま含む、連結後の新しい配列
- NULL：入力配列のいずれかが NULL の場合

使用上の注意：
- 空の配列は無視され、結果に要素を追加しません
- 引数が一つだけで、その配列が空なら空の配列を返し、NULL なら NULL を返します
- 複合型（ネストした配列、MAP、STRUCT）を連結する場合、構造が完全に一致している必要があります。一致しない場合はエラーが発生します
- 配列内の NULL 要素は、連結結果にもそのまま保持されます

### 例

```sql
CREATE TABLE array_concat_test (
    id INT,
    int_array1 ARRAY<INT>,
    int_array2 ARRAY<INT>,
    string_array1 ARRAY<STRING>,
    string_array2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_concat_test VALUES
(1, [1, 2, 3], [4, 5, 6], ['a', 'b'], ['c', 'd']),
(2, [10, 20], [30, 40], [], ['x', 'y']),
(3, NULL, [100, 200], NULL, ['z']),
(4, [], [], [], []),
(5, [1, null, 3], [null, 5, 6], ['a', null, 'c'], ['d', 'e']);
```

**クエリ例：**

複数の配列リテラルを連結する場合：
```sql
SELECT array_concat([1, 2], [7, 8], [5, 6]);
+--------------------------------------+
| array_concat([1, 2], [7, 8], [5, 6]) |
+--------------------------------------+
| [1, 2, 7, 8, 5, 6]                   |
+--------------------------------------+
```

文字列配列を連結する場合：
```sql
SELECT array_concat(string_array1, string_array2) FROM array_concat_test WHERE id = 1;
+--------------------------------------------+
| array_concat(string_array1, string_array2) |
+--------------------------------------------+
| ["a", "b", "c", "d"]                       |
+--------------------------------------------+
```

空の配列を連結する場合：
```sql
SELECT array_concat([], []);
+----------------------+
| array_concat([], []) |
+----------------------+
| []                   |
+----------------------+
```

NULL の配列を連結する場合：
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 3;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

NULL 要素を含む配列を連結する場合：NULL 要素は連結結果にもそのまま保持されます。
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 5;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| [1, null, 3, null, 5, 6]             |
+--------------------------------------+
```

型の互換性の例：int_array1 と string_array1 を連結すると、整数の要素が文字列に変換され、すべての要素が保持されます。
```sql
SELECT array_concat(int_array1, string_array1) FROM array_concat_test WHERE id = 1;
+-----------------------------------------+
| array_concat(int_array1, string_array1) |
+-----------------------------------------+
| ["1", "2", "3", "a", "b"]            |
+-----------------------------------------+
```

複合型の例：

ネストした配列を連結する場合、構造が一致していれば連結できます。
```sql
SELECT array_concat([[1,2],[3,4]], [[5,6],[7,8]]);
+--------------------------------------------+
| array_concat([[1,2],[3,4]], [[5,6],[7,8]]) |
+--------------------------------------------+
| [[1, 2], [3, 4], [5, 6], [7, 8]]           |
+--------------------------------------------+
```

ネストした配列の構造が一致しない場合は、エラーが発生します。
```sql
SELECT array_concat([[1,2]], [{'k':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<ARRAY<INT>> to target type=ARRAY<DOUBLE>
```

MAP 型を連結する場合、構造が一致していれば連結できます。
```sql
SELECT array_concat([{'k':1}], [{'k':2}]);
+------------------------------------+
| array_concat([{'k':1}], [{'k':2}]) |
+------------------------------------+
| [{"k":1}, {"k":2}]                 |
+------------------------------------+
```

STRUCT 型を連結する場合、構造が一致していれば連結できます。
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30)));
+--------------------------------------------------------------------------------------------------------+
| array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30))) |
+--------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                                                 |
+--------------------------------------------------------------------------------------------------------+
```

STRUCT の構造が一致しない場合は、エラーが発生します。
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('id',1,'score',95.5,'age',10)));
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<STRUCT<name:VARCHAR(5),age:TINYINT>> to target type=ARRAY<DOUBLE>
```

引数の数が正しくない場合は、エラーが発生します。
```sql
SELECT array_concat();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_concat' which has 0 arity. Candidate functions are: [array_concat(Expression, Expression, ...)]
```

配列以外の型を渡すと、エラーが発生します。
```sql
SELECT array_concat('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_concat(VARCHAR(12))
```

### 注記

すべての入力配列の要素型に互換性があることを確認してください。特にネストした複合型では、実行時の型変換エラーを避けるため、構造を一致させる必要があります。

### キーワード

ARRAY, CONCAT, ARRAY_CONCAT
