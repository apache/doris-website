---
{
    "title": "ARRAY_MAX",
    "language": "zh-CN",
    "description": "计算数组中的最大值。函数会遍历数组中的所有元素，找到最大的值并返回。"
}
---

## array_max

<version since="2.0.0">

</version>

## 描述

计算数组中的最大值。函数会遍历数组中的所有元素，找到最大的值并返回。

## 语法

```sql
array_max(ARRAY<T> arr)
```

### 参数

- `arr`：ARRAY<T> 类型，要计算最大值的数组。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6

### 返回值

返回类型：T

返回值含义：
- 返回数组中的最大值
- NULL：如果数组为空、或者所有元素都为 null

使用说明：
- 通过比较数组中的元素来确定要返回的元素，支持比较相同数据类型
- 数组为 NULL，会返回类型转换错误
- 对数组元素中的 null 值：null 元素不参与比较

**查询示例：**

计算浮点数数组的最大值：
```sql
SELECT array_max([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]);
+-------------------------------------------+
| array_max([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]) |
+-------------------------------------------+
|                                       9.9 |
+-------------------------------------------+
```

计算字符串数组的最大值（按字典序）：
```sql
SELECT array_max(['zebra', 'appleeee', 'banana', 'cherry']);
+------------------------------------------------------+
| array_max(['zebra', 'appleeee', 'banana', 'cherry']) |
+------------------------------------------------------+
| zebra                                                |
+------------------------------------------------------+
```

计算包含 null 的数组的最大值：
```sql
SELECT array_max([5, null, 2, null, 8, 1]);
+-------------------------------------+
| array_max([5, null, 2, null, 8, 1]) |
+-------------------------------------+
|                                   8 |
+-------------------------------------+
```

空数组返回 NULL：
```sql
SELECT array_max([]);
+------------------+
| array_max([])    |
+------------------+
| NULL             |
+------------------+
```

所有元素都为 null 的数组返回 NULL：
```sql
SELECT array_max([null, null, null]);
+----------------------------------+
| array_max([null, null, null])    |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

日期数组的最大值：
```sql
SELECT array_max(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>));
+--------------------------------------------------------------------------------+
| array_max(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>)) |
+--------------------------------------------------------------------------------+
| 2023-06-15 00:00:00                                                            |
+--------------------------------------------------------------------------------+
```

IP 地址数组的最大值：
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

复杂类型示例：

嵌套数组类型不支持，报错：
```sql
SELECT array_max([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_max does not support complex types: array_max([[1, 2], [3, 4], [5, 6]])
```

map 类型不支持，报错：
```sql
SELECT array_max([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_max does not support complex types: array_max([map('k', 1), map('k', 2), map('k', 3)])
```

参数数量错误会报错：
```sql
SELECT array_max([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_max' which has 2 arity. Candidate functions are: [array_max(Expression)]
```

传入非数组类型时会报错：
```sql
SELECT array_max('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

数组为 NULL，会返回类型转换错误
```
mysql> SELECT array_max(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### Keywords

ARRAY, MAX, ARRAY_MAX
