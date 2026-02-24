---
{
    "title": "ARRAY_DIFFERENCE",
    "language": "zh-CN",
    "description": "计算数组中相邻元素的差值。函数会从左到右遍历数组，计算每个元素与其前一个元素的差值，返回一个与原数组等长的新数组。第一个元素的差值始终为 0。"
}
---

## array_difference

<version since="2.0.0">

</version>

## 描述

计算数组中相邻元素的差值。函数会从左到右遍历数组，计算每个元素与其前一个元素的差值，返回一个与原数组等长的新数组。第一个元素的差值始终为 0。

## 语法

```sql
array_difference(ARRAY<T> arr)
```

### 参数

- `arr`：ARRAY\<T> 类型，要计算差值的数组。支持列名或常量值。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL


### 返回值

返回类型：ARRAY\<T>

返回值含义：
- 返回一个与输入数组等长的新数组，每个位置的值为当前元素与前一个元素的差值，第一个元素的差值为 0
- NULL：如果输入数组为 NULL

使用说明：
- 差值的计算顺序为从左到右，每个位置的值为当前元素与前一个元素的差值，第一个元素为 0。
- 空数组返回空数组，NULL 数组返回 NULL，只有一个元素的数组返回 [0]。
- 复杂类型（嵌套数组、MAP、STRUCT）不支持差值计算，调用会报错。
- 对数组元素中的 null 值：null 元素会影响后续差值计算，前一个元素为 null 时，当前差值为 null

### 示例

```sql
CREATE TABLE array_difference_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_difference_test VALUES
(1, [1, 3, 6, 10, 15], [1.1, 3.3, 6.6, 11.0, 16.5]),
(2, [10, 30, 60], [10.5, 41.0, 76.5]),
(3, [], []),
(4, NULL, NULL);
```

**查询示例：**

int_array 的差值：每个位置的值为当前元素与前一个元素的差值，第一个元素为 0。
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 1;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| [0, 2, 3, 4, 5]             |
+-----------------------------+
```

double_array 的差值：浮点数数组的差值，结果为浮点数。

注意，第二个位置的结果是 2.1999999999999997，这是由于浮点数的二进制表示精度导致的微小误差（3.3 - 1.1 在二进制下无法精确表示为 2.2）。后面的 3.3、4.4、5.5 虽然看上去是“正常值”，其实也是二进制近似值，只是四舍五入后与十进制一致。这是所有基于 IEEE 754 浮点数的系统（包括 MySQL、Snowflake、Python、JavaScript 等）都会遇到的现象。
```sql
SELECT array_difference(double_array) FROM array_difference_test WHERE id = 1;
+------------------------------------------+
| array_difference(double_array)           |
+------------------------------------------+
| [0, 2.1999999999999997, 3.3, 4.4, 5.5]  |
+------------------------------------------+
```

空数组返回空数组：
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 3;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL 数组返回 NULL：当输入数组为 NULL 时返回 NULL，不会抛出错误。
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 4;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

只有一个元素的数组返回 [0]：
```sql
SELECT array_difference([42]);
+------------------------+
| array_difference([42]) |
+------------------------+
| [0]                    |
+------------------------+
```

包含 null 的数组，前一个元素为 null 时，当前差值为 null。
```sql
SELECT array_difference([1, null, 3, null, 5]);
+-----------------------------------------+
| array_difference([1, null, 3, null, 5]) |
+-----------------------------------------+
| [0, null, null, null, null]             |
+-----------------------------------------+
```

字符串和数值混合时，能转换为数值的元素会参与差值计算，不能转换的为 null，结果对应位置为 null。
```sql
SELECT array_difference(['a', 1, 'b', 2, 'c', 3]);
+--------------------------------------------+
| array_difference(['a', 1, 'b', 2, 'c', 3]) |
+--------------------------------------------+
| [null, null, null, null, null, null]       |
+--------------------------------------------+
```

复杂类型示例：

嵌套数组类型不支持，报错。
```sql
SELECT array_difference([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<ARRAY<TINYINT>>)
```

map 类型不支持，报错。
```sql
SELECT array_difference([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```

struct 类型不支持，报错。
```sql
SELECT array_difference(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```

参数数量错误会报错。
```sql
SELECT array_difference([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_difference' which has 2 arity. Candidate functions are: [array_difference(Expression)]
```

传入非数组类型时会报错。
```sql
SELECT array_difference('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(VARCHAR(12))
```

### keywords

ARRAY, DIFFERENCE, ARRAY_DIFFERENCE 