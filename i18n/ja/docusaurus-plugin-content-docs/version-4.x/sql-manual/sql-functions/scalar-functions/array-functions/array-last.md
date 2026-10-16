---
{
    "title": "ARRAY_LAST",
    "language": "ja",
    "description": "ラムダ式で指定した条件を満たす配列内の最後の要素を検索して返します。"
}
---

## array_last

<version since="2.0.0">

</version>

## 説明

ラムダ式で指定した条件を満たす配列内の最後の要素を検索して返します。

## 構文

```sql
array_last(lambda, ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### パラメータ

- `lambda`：検索条件を定義するラムダ式
- `arr1, arr2, ...`：検索対象の ARRAY<T> 型の配列。一つ以上の配列パラメータを指定できます。

**T でサポートされる型：**
- 数値型：TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型：CHAR, VARCHAR, STRING
- 日付・時刻型：DATE, DATETIME, DATEV2, DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4, IPV6
- 複合型：ARRAY, MAP, STRUCT

### 戻り値

戻り値の型：T

戻り値の意味：
- ラムダ式の条件を満たす配列内の最後の要素を返します。
- NULL：条件を満たす要素がない場合、または入力配列が NULL の場合に返します。

使用上の注意：
- ラムダ式のパラメータ数は、配列パラメータの数と一致する必要があります。
- 条件を満たす要素がない場合は NULL を返します。
- NULL の入力パラメータはサポートしません。
- 複数の配列パラメータを指定する場合、すべての配列の長さが同じである必要があります。
- ラムダ式では任意のスカラー式を使用できますが、集約関数は使用できません。
- ラムダ式から他の高階関数を呼び出せますが、戻り値の型に互換性が必要です。
- 配列要素に NULL が含まれる場合、その NULL 要素はラムダ式に渡されます。ラムダ式で NULL かどうかを判定できます。

**クエリ例：**

浮動小数点数の配列から、3 以上の最後の要素を検索します：
```sql
SELECT array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+----------------------------------------------------+
| array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+----------------------------------------------------+
|                                                5.5 |
+----------------------------------------------------+
```

文字列の配列から、長さが 2 より大きい最後の要素を検索します：
```sql
SELECT array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+---------------------------------------------------------------------+
| array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+---------------------------------------------------------------------+
| eeeee                                                               |
+---------------------------------------------------------------------+
```

空の配列では NULL を返します：
```sql
SELECT array_last(x -> x > 0, []);
+-------------------------------------+
| array_last(x -> x > 0, [])        |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

入力パラメータが NULL の場合はエラーになります：
```sql
SELECT array_last(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL

SELECT array_last(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_last', expression: array_last(NULL), The 1st arg of array_filter must be lambda but is NULL
```

NULL を含む配列では、ラムダ式で NULL かどうかを判定できます：
```sql
SELECT array_last(x -> x is not null, [null, 1, null, 3, null, 5]);
+-------------------------------------------------------------+
| array_last(x -> x is not null, [null, 1, null, 3, null, 5]) |
+-------------------------------------------------------------+
|                                                           5 |
+-------------------------------------------------------------+
```

複数の配列を検索し、最初の配列の要素が次の配列の要素より大きくなる最後の要素を検索します：
```sql
SELECT array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+-------------------------------------------------------------------------+
| array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```

入れ子になった配列から、要素数が 2 より大きい最後の部分配列を検索します：
```sql
SELECT array_last(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+--------------------------------------------------------------+
| array_last(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+--------------------------------------------------------------+
| [7, 8, 9, 10]                                                |
+--------------------------------------------------------------+
```

パラメータ数が正しくない場合はエラーになります：
```sql
SELECT array_last();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_last' which has 0 arity. Candidate functions are: [array_last(Expression, Expression...)]
```

ラムダ式のパラメータ数と配列パラメータの数が一致しない場合はエラーになります：
```sql
SELECT array_last(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

配列型以外の値を渡すとエラーになります：
```sql
SELECT array_last(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_last(Expression, VARCHAR(12))
```

### キーワード

ARRAY, LAST, ARRAY_LAST
