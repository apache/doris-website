---
{
    "title": "ARRAY_MIN",
    "language": "ja",
    "description": "配列内の最小値を計算します。配列のすべての要素を走査し、最小値を見つけて返します。"
}
---

## array_min

<version since="2.0.0">

</version>

## 説明

配列内の最小値を計算します。配列のすべての要素を走査し、最小値を見つけて返します。

## 構文

```sql
array_min(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY<T> 型。最小値を計算する対象の配列です。

**T に指定できる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付・時刻型: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 真偽値型: BOOLEAN
- IP 型: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)

### 戻り値

戻り値の型: T

戻り値の意味:
- 配列内の最小値を返します
- NULL: 配列が空の場合、またはすべての要素が NULL の場合に返します

使用上の注意:
- 配列内の要素を比較して返す要素を決定します。同じデータ型の要素同士を比較できます
- 配列が NULL の場合、型変換エラーが発生します
- 配列内の NULL 要素は比較に含まれません

**クエリ例:**

浮動小数点数の配列の最小値を計算します:
```sql
SELECT array_min([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]);
+-------------------------------------------+
| array_min([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]) |
+-------------------------------------------+
|                                       1.1 |
+-------------------------------------------+
```

文字列の配列の最小値を辞書順で計算します:
```sql
SELECT array_min(['zebra', 'apple', 'banana', 'cherry']);
+---------------------------------------------------+
| array_min(['zebra', 'apple', 'banana', 'cherry']) |
+---------------------------------------------------+
| apple                                             |
+---------------------------------------------------+
```

NULL 値を含む配列の最小値を計算します。NULL 要素は比較に含まれません:
```sql
SELECT array_min([5, null, 2, null, 8, 1]);
+-------------------------------------+
| array_min([5, null, 2, null, 8, 1]) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
```

空の配列の場合は NULL を返します:
```sql
SELECT array_min([]);
+------------------+
| array_min([])    |
+------------------+
| NULL             |
+------------------+
```

すべての要素が NULL の配列の場合は NULL を返します:
```sql
SELECT array_min([null, null, null]);
+----------------------------------+
| array_min([null, null, null])    |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

日付の配列の最小値を計算します:
```sql
SELECT array_min(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>));
+--------------------------------------------------------------------------------+
| array_min(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>)) |
+--------------------------------------------------------------------------------+
| 2022-12-31 00:00:00                                                            |
+--------------------------------------------------------------------------------+
```

IP アドレスの配列の最小値を計算します:
```sql
SELECT array_min(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>));
+----------------------------------------------------------------------------------+
| array_min(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>)) |
+----------------------------------------------------------------------------------+
| 192.168.1.1                                                                      |
+----------------------------------------------------------------------------------+

SELECT array_min(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>));
+-------------------------------------------------------------------------------+
| array_min(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>)) |
+-------------------------------------------------------------------------------+
| 2001:db8::                                                                    |
+-------------------------------------------------------------------------------+
```

複合型の例:

ネストした配列型はサポートされておらず、エラーになります:
```sql
SELECT array_min([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_min does not support complex types: array_min([[1, 2], [3, 4], [5, 6]])
```

Map 型はサポートされておらず、エラーになります:
```sql
SELECT array_min([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_min does not support complex types: array_min([map('k', 1), map('k', 2), map('k', 3)])
```

引数の数が正しくない場合、エラーになります:
```sql
SELECT array_min([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_min' which has 2 arity. Candidate functions are: [array_min(Expression)]
```

配列型以外を渡すと、エラーになります:
```sql
SELECT array_min('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

配列が NULL の場合、型変換エラーが発生します:
```sql
mysql> SELECT array_min(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### キーワード

ARRAY, MIN, ARRAY_MIN
