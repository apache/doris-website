---
{
    "title": "ARRAY_CUM_SUM",
    "language": "zh-CN",
    "description": "计算数组的累积和。函数会从左到右遍历数组，计算每个位置之前（包括当前位置）所有元素的和，返回一个与原数组等长的新数组。"
}
---

## array_cum_sum

<version since="2.0.0">


</version>

## 描述

计算数组的累积和。函数会从左到右遍历数组，计算每个位置之前（包括当前位置）所有元素的和，返回一个与原数组等长的新数组。

## 语法

```sql
array_cum_sum(ARRAY<T> arr)
```

### 参数

- `arr`：ARRAY\<T> 类型，要计算累积和的数组。支持列名或常量值。

**T 支持的类型：**
  - 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL

### 返回值

返回类型：ARRAY\<T>

返回值含义：

- 返回一个与输入数组等长的新数组，每个位置的值为原数组从开始到当前位置的所有元素之和
- NULL：如果输入数组为 NULL

使用说明：
- 累积和的计算顺序为从左到右，每个位置的值为前面所有非 null 元素的和。
- 空数组返回空数组，NULL 数组返回 NULL，只有一个元素的数组返回原数组。
- 嵌套数组、MAP、STRUCT 等复杂类型不支持累积和，调用会报错。

### 示例

```sql
CREATE TABLE array_cum_sum_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_cum_sum_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]),
(2, [10, 20, 30], [10.5, 20.5, 30.5]),
(3, [], []),
(4, NULL, NULL);
```

**查询示例：**

int_array 的累积和：每个位置的值为前面所有元素（包括当前位置）的和。
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 1;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| [1, 3, 6, 10, 15]           |
+-----------------------------+
```

double_array 的累积和：浮点数数组的累积和，结果为浮点数。

注意，第二个位置的结果是 3.3000000000000003，这是由于浮点数的二进制表示精度导致的微小误差, 1.1 和 2.2 在二进制浮点（IEEE 754 double）中都无法精确表示，只能近似存储, 两者相加后，误差累积，结果是 3.3000000000000003, 后续累积和（如 6.6、11、16.5）虽然显示为“正常值”，其实也是近似值，只是四舍五入后与十进制一致。这是所有基于 IEEE 754 浮点数的系统（包括 MySQL、Snowflake、Python、JavaScript 等）都会遇到的现象。
```sql
SELECT array_cum_sum(double_array) FROM array_cum_sum_test WHERE id = 1;
+------------------------------------------+
| array_cum_sum(double_array)              |
+------------------------------------------+
| [1.1, 3.3000000000000003, 6.6, 11, 16.5] |
+------------------------------------------+
```

字符串和数值混合时，能转换为数值的元素会参与累积和，不能转换的为 null，结果对应位置为 null。
```sql
SELECT array_cum_sum(['a', 1, 'b', 2, 'c', 3]);
+-----------------------------------------+
| array_cum_sum(['a', 1, 'b', 2, 'c', 3]) |
+-----------------------------------------+
| [0, 1, 1, 3, 3, 6]                      |
+-----------------------------------------+
```

空数组返回空数组：
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 3;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL 数组返回 NULL：当输入数组为 NULL 时返回 NULL，不会抛出错误。
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 4;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

只有一个元素的数组返回原数组：
```sql
SELECT array_cum_sum([42]);
+----------------------+
| array_cum_sum([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

包含 null 的数组，从第一个非 null 开始记录记录累加值之后的 null 将作为0参与累积和计算
```sql
SELECT array_cum_sum([null, 1, null, 3, null, 5]);
+--------------------------------------------+
| array_cum_sum([null, 1, null, 3, null, 5]) |
+--------------------------------------------+
| [null, 1, 1, 4, 4, 9]                      |
+--------------------------------------------+
```

复杂类型示例：

嵌套数组类型不支持，报错。
```sql
SELECT array_cum_sum([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<ARRAY<TINYINT>>)
```

map 类型不支持，报错。
```sql
SELECT array_cum_sum([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```

struct 类型不支持，报错。
```sql
SELECT array_cum_sum(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```

参数数量错误会报错。
```sql
SELECT array_cum_sum([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_cum_sum' which has 2 arity. Candidate functions are: [array_cum_sum(Expression)]
```

传入非数组类型时会报错。
```sql
SELECT array_cum_sum('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(VARCHAR(12))
```

### keywords

ARRAY, CUM, SUM, CUM_SUM, ARRAY_CUM_SUM 
