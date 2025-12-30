---
{
    "title": "ARRAY_DISTINCT",
    "language": "zh-CN",
    "description": "去除数组中的重复元素，返回一个包含唯一元素的新数组。函数会保持元素的原始顺序，只保留每个元素的第一次出现。"
}
---

## array_distinct

<version since="2.0.0">


</version>

## 描述

去除数组中的重复元素，返回一个包含唯一元素的新数组。函数会保持元素的原始顺序，只保留每个元素的第一次出现。

## 语法

```sql
array_distinct(ARRAY<T> arr)
```

### 参数

- `arr`：ARRAY\<T> 类型，要去重的数组。支持列名或常量值。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6

### 返回值

返回类型：ARRAY\<T>

返回值含义：
- 去重后的数组，包含原数组中的所有唯一元素
- 保持元素的原始顺序
- NULL：如果输入数组为 NULL

使用说明：
- 函数从左到右遍历数组，保留每个元素的第一次出现，移除后续的重复元素
- 空数组返回空数组，NULL 数组返回 NULL
- 去重操作保持原始数组中元素的相对顺序，不重新排序
- 对数组元素中的 null 值：null 元素会被去重，多个 null 只保留一个

### 示例

**查询示例：**

整数数组去重，原数组 [1, 2, 3, 4, 5] 中没有重复元素，所以去重后结果与原数组相同。
```sql
SELECT array_distinct([1, 2, 3, 4, 5]);
+---------------------------------+
| array_distinct([1, 2, 3, 4, 5]) |
+---------------------------------+
| [1, 2, 3, 4, 5]                 |
+---------------------------------+
```

字符串数组去重：去除重复的字符串元素。原数组 ['a', 'b', 'a', 'c', 'b', 'd'] 中，'a' 出现两次（保留第一次），'b' 出现两次（保留第一次），去重后为 ["a", "b", "c", "d"]。
```sql
SELECT array_distinct(['a', 'b', 'a', 'c', 'b', 'd']);
+------------------------------------------------+
| array_distinct(['a', 'b', 'a', 'c', 'b', 'd']) |
+------------------------------------------------+
| ["a", "b", "c", "d"]                           |
+------------------------------------------------+
```

包含 null 值的数组：null 元素也会被去重，多个 null 只保留一个。原数组 [1, null, 2, null, 3, null] 中，null 出现三次，去重后只保留第一个 null，结果为 [1, null, 2, 3]。
```sql
SELECT array_distinct([1, null, 2, null, 3, null]);
+---------------------------------------------+
| array_distinct([1, null, 2, null, 3, null]) |
+---------------------------------------------+
| [1, null, 2, 3]                             |
+---------------------------------------------+
```

IP 类型数组去重：IPv4 地址数组的去重。原数组 ['192.168.1.1', '192.168.1.2', '192.168.1.1'] 中，'192.168.1.1' 出现两次，去重后只保留第一次出现的地址，结果为 [192.168.1.1, 192.168.1.2]。
```sql
SELECT array_distinct(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------+
| array_distinct(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2"]                                                     |
+------------------------------------------------------------------------------------+
```

IPv6 类型数组去重：IPv6 地址数组的去重。原数组 ['2001:db8::1', '2001:db8::2', '2001:db8::1'] 中，'2001:db8::1' 出现两次，去重后只保留第一次出现的地址，结果为 [2001:db8::1, 2001:db8::2]。
```sql
SELECT array_distinct(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------+
| array_distinct(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------+
| ["2001:db8::1", "2001:db8::2"]                                                     |
+------------------------------------------------------------------------------------+
```

空数组返回空数组：空数组没有元素需要去重，直接返回空数组。
```sql
+--------------------+
| array_distinct([]) |
+--------------------+
| []                 |
+--------------------+
```

NULL 数组返回 NULL：当输入数组为 NULL 时返回 NULL，不会抛出错误。
```sql
+----------------------+
| array_distinct(NULL) |
+----------------------+
| NULL                 |
+----------------------+
```

单个元素数组返回原数组：只有一个元素的数组没有重复元素，去重后结果与原数组相同。
```sql
SELECT array_distinct([42]);
+----------------------+
| array_distinct([42]) |
+----------------------+
| [42]                 |
+----------------------+
```

复杂类型不支持：

嵌套数组类型不支持，报错。
```sql
SELECT array_distinct([[1,2,3], [4,5,6], [1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Array(Nullable(TINYINT)))))
```

map 类型不支持，报错。
```sql
SELECT array_distinct([{'a':1}, {'b':2}, {'a':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Map(Nullable(String), Nullable(TINYINT)))))
```

struct 类型不支持，报错。
```sql
SELECT array_distinct(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30), named_struct('name','Alice','age',20)));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Struct(name:Nullable(String), age:Nullable(TINYINT)))))
```

参数数量错误会报错：array_distinct 函数只接受一个数组参数，传入多个参数会报错。
```sql
SELECT array_distinct([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_distinct' which has 2 arity. Candidate functions are: [array_distinct(Expression)]
```

传入非数组类型时会报错：array_distinct 函数只接受数组类型参数，传入字符串等非数组类型会报错。
```sql
SELECT array_distinct('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_distinct(VARCHAR(12))
```

### keywords

ARRAY, DISTINCT, ARRAY_DISTINCT 