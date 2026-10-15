---
{
    "title": "ARRAY_MAX",
    "language": "ja",
    "description": "配列内の最大値を計算します。この関数は配列内のすべての要素を調べ、最大値を見つけて返します。"
}
---

## array_max

<version since="2.0.0">

</version>

## 説明

配列内の最大値を計算します。この関数は配列内のすべての要素を調べ、最大値を見つけて返します。

## 構文

```sql
array_max(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY<T> 型。最大値を計算する対象の配列です。

**T に使用できる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6

### 戻り値

戻り値の型：T

戻り値の意味：
- 配列内の最大値を返します。
- NULL：配列が空の場合、またはすべての要素が null の場合に返します。

使用上の注意：
- 配列内の要素を比較して返す要素を決定します。同じデータ型の要素同士を比較できます。
- 配列が NULL の場合、型変換エラーになります。
- 配列内の null 要素は比較対象に含まれません。

**クエリの例：**

浮動小数点数の配列の最大値を計算します：
```sql
SELECT array_max([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]);
+-------------------------------------------+
| array_max([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]) |
+-------------------------------------------+
|                                       9.9 |
+-------------------------------------------+
```

文字列の配列の最大値を辞書順で計算します：
```sql
SELECT array_max(['zebra', 'appleeee', 'banana', 'cherry']);
+------------------------------------------------------+
| array_max(['zebra', 'appleeee', 'banana', 'cherry']) |
+------------------------------------------------------+
| zebra                                                |
+------------------------------------------------------+
```

null 値を含む配列の最大値を計算します：
```sql
SELECT array_max([5, null, 2, null, 8, 1]);
+-------------------------------------+
| array_max([5, null, 2, null, 8, 1]) |
+-------------------------------------+
|                                   8 |
+-------------------------------------+
```

空の配列の場合は NULL を返します：
```sql
SELECT array_max([]);
+------------------+
| array_max([])    |
+------------------+
| NULL             |
+------------------+
```

すべての要素が null の配列の場合は NULL を返します：
```sql
SELECT array_max([null, null, null]);
+----------------------------------+
| array_max([null, null, null])    |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

日付の配列の最大値を計算します：
```sql
SELECT array_max(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>));
+--------------------------------------------------------------------------------+
| array_max(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>)) |
+--------------------------------------------------------------------------------+
| 2023-06-15 00:00:00                                                            |
+--------------------------------------------------------------------------------+
```

IP アドレスの配列の最大値を計算します：
```sql
SELECT array_max(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>));
+----------------------------------------------------------------------------------+
| array_max(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>)) |
+----------------------------------------------------------------------------------+
| 192.168.1.100                                                                    |
+----------------------------------------------------------------------------------+

SELECT array_max(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>));
+-------------------------------------------------------------------------------+
| array_max(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>)) |
+-------------------------------------------------------------------------------+
| 2001:db8::2                                                                   |
+-------------------------------------------------------------------------------+
```

複合型の例：

ネストした配列型はサポートされておらず、エラーになります：
```sql
SELECT array_max([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_max does not support complex types: array_max([[1, 2], [3, 4], [5, 6]])
```

Map 型はサポートされておらず、エラーになります：
```sql
SELECT array_max([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_max does not support complex types: array_max([map('k', 1), map('k', 2), map('k', 3)])
```

パラメータの数が正しくない場合はエラーになります：
```sql
SELECT array_max([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_max' which has 2 arity. Candidate functions are: [array_max(Expression)]
```

配列以外の型を渡すとエラーになります：
```sql
SELECT array_max('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

配列が NULL の場合は型変換エラーになります：
```sql
mysql> SELECT array_max(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### キーワード

ARRAY, MAX, ARRAY_MAX
