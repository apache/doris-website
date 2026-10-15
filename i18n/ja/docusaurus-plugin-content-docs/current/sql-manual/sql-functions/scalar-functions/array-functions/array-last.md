---
{
    "title": "ARRAY_LAST",
    "language": "ja",
    "description": "ラムダ式を満たす配列内の最後の要素を探し、その要素を返します。"
}
---

## array_last

<version since="2.0.0">

</version>

## 説明

ラムダ式を満たす配列内の最後の要素を探し、その要素を返します。

## 構文

```sql
array_last(lambda, ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### パラメータ

- `lambda`：検索条件を定義するラムダ式
- `arr1, arr2, ...`：ARRAY<T> 型の検索対象配列。一つ以上の配列パラメータを指定できます。

**T に使用できる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2、TIMESTAMP_NS
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- UUID：[UUID](../../../basic-element/sql-data-types/uuid.md)
- 複合型：ARRAY、MAP、STRUCT

### 戻り値

戻り値の型：T

戻り値の意味：
- ラムダ式を満たす配列内の最後の要素を返します
- NULL：条件を満たす要素がない場合、または入力配列が NULL の場合

使用上の注意：
- ラムダ式のパラメータ数は配列パラメータの数と一致する必要があります
- 条件を満たす要素がない場合は NULL を返します
- NULL の入力パラメータはサポートされません
- 複数の配列パラメータを指定する場合、すべての配列の長さが同じである必要があります
- ラムダ式では任意のスカラー式を使用できますが、集約関数は使用できません
- ラムダ式から他の高階関数を呼び出せますが、戻り値の型に互換性がある必要があります
- 配列要素が null の場合、その要素は処理のためにラムダ式に渡され、ラムダ式で null かどうかを判定できます

**クエリ例：**

浮動小数点数の配列から、3 以上の最後の要素を探します：
```sql
SELECT array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+----------------------------------------------------+
| array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+----------------------------------------------------+
|                                                5.5 |
+----------------------------------------------------+
```

文字列の配列から、長さが 2 より大きい最後の要素を探します：
```sql
SELECT array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+---------------------------------------------------------------------+
| array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+---------------------------------------------------------------------+
| eeeee                                                               |
+---------------------------------------------------------------------+
```

空の配列の場合は NULL を返します：
```sql
SELECT array_last(x -> x > 0, []);
+-------------------------------------+
| array_last(x -> x > 0, [])        |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

NULL の入力パラメータを指定するとエラーになります：
```sql
SELECT array_last(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL

SELECT array_last(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_last', expression: array_last(NULL), The 1st arg of array_filter must be lambda but is NULL
```

null 値を含む配列では、ラムダ式で null かどうかを判定できます：
```sql
SELECT array_last(x -> x is not null, [null, 1, null, 3, null, 5]);
+-------------------------------------------------------------+
| array_last(x -> x is not null, [null, 1, null, 3, null, 5]) |
+-------------------------------------------------------------+
|                                                           5 |
+-------------------------------------------------------------+
```

複数の配列を検索し、最初の配列の要素が二番目の配列の要素より大きい位置にある最後の要素を探します：
```sql
SELECT array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+-------------------------------------------------------------------------+
| array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```

入れ子の配列を検索し、要素数が 2 より大きい最後の部分配列を探します：
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

ラムダ式のパラメータ数が配列パラメータの数と一致しない場合はエラーになります：
```sql
SELECT array_last(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

配列以外の型を渡すとエラーになります：
```sql
SELECT array_last(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_last(Expression, VARCHAR(12))
```

### キーワード

ARRAY, LAST, ARRAY_LAST
