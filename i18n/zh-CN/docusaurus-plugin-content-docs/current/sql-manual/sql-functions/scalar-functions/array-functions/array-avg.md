---
{
    "title": "ARRAY_AVG",
    "language": "zh-CN"
}
---

## array_avg

<version since="2.0.0">

</version>

## 描述

计算数组中所有数值元素的平均值。函数会跳过数组中的 null 值和非数值元素，只对有效的数值元素进行平均值计算。

## 语法

```sql
array_avg(ARRAY<T> arr)
```

### 参数

- `arr`：ARRAY<T> 类型，要计算平均值的数组。支持列名或常量值。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING（会尝试转换为数值）
- 布尔类型：BOOLEAN（会尝试转换为数值）

### 返回值

返回类型：根据输入类型自动选择

返回值含义：
- 返回数组中所有有效数值元素的平均值
- NULL：或数组为空，或所有元素都为 NULL 或无法转换为数值

使用说明：
- 如果数组包含其他类型（如字符串等），会尝试将元素转换为 DOUBLE 类型。转换失败的元素会被跳过，不参与平均值计算
- 函数会尝试将所有元素转换为兼容的数值类型进行平均值计算，平均值的返回类型根据输入类型自动选择：
  - 输入为 DOUBLE 或 FLOAT 时，返回 DOUBLE
  - 输入为整数类型时，返回 DOUBLE
  - 输入为 DECIMAL 时，返回 DECIMAL，保持原精度和标度
- 空数组返回 NULL，只有一个元素的数组返回该元素的值
- 数组为 NULL，会返回类型转换错误
- 嵌套数组、MAP、STRUCT 等复杂类型不支持平均值计算，调用会报错
- 对数组元素中的 null 值：null 元素不参与平均值计算

### 示例

```sql
CREATE TABLE array_avg_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    mixed_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_avg_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['1', '2', '3', '4', '5']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['10', '20', '30']),
(3, [], [], []),
(4, NULL, NULL, NULL),
(5, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['1', null, '3', null, '5']);
```

**查询示例：**

计算 double_array 的平均值：
```sql
SELECT array_avg(double_array) FROM array_avg_test WHERE id = 1;
+-------------------------+
| array_avg(double_array) |
+-------------------------+
|                     3.3 |
+-------------------------+
```

计算混合类型数组的平均值，字符串会被转换为数值：
```sql
SELECT array_avg(mixed_array) FROM array_avg_test WHERE id = 1;
+------------------------+
| array_avg(mixed_array) |
+------------------------+
|                      3 |
+------------------------+
```

空数组返回 NULL：
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 3;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

NULL 数组返回 NULL：
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 4;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

包含 null 的数组，null 元素不参与计算：
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 5;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                    3 |
+----------------------+
```

复杂类型示例：

嵌套数组类型不支持，报错：
```sql
SELECT array_avg([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([[1, 2, 3]]) does not support type: ARRAY<TINYINT>
```

map 类型不支持，报错：
```sql
SELECT array_avg([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([map('k', 1), map('k', 2)]) does not support type: MAP<VARCHAR(1),TINYINT>
```

参数数量错误会报错：
```sql
SELECT array_avg([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_avg' which has 2 arity. Candidate functions are: [array_avg(Expression)]
```

传入非数组类型时会报错：
```sql
SELECT array_avg('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_avg(VARCHAR(12))
```

数组为 NULL，会返回类型转换错误
```
mysql> SELECT array_max(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### Keywords

ARRAY, AVG, ARRAY_AVG