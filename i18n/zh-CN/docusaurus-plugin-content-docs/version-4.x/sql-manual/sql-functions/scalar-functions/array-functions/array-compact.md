---
{
    "title": "ARRAY_COMPACT",
    "language": "zh-CN",
    "description": "去除数组中连续重复的元素，只保留每个不同值的第一个出现位置。该函数从左到右遍历数组，遇到与前一个元素相同的值时会跳过该元素，只保留第一个出现的值。"
}
---

## array_compact

<version since="2.0.0">

</version>

## 描述

去除数组中连续重复的元素，只保留每个不同值的第一个出现位置。该函数从左到右遍历数组，遇到与前一个元素相同的值时会跳过该元素，只保留第一个出现的值。

## 语法

```sql
array_compact(ARRAY<T> arr)
```

### 参数

- `arr`：ARRAY<T> 类型，要去重的数组。支持列名或常量值。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂数据类型：ARRAY

### 返回值

返回类型：ARRAY\<T>

返回值含义：
- 去重后的数组，只保留连续重复元素中的第一个
- NULL：如果输入数组为 NULL

返回值行为说明：

1. 正常去重行为：
   - 从左到右遍历数组,保留第一个出现的元素,跳过与前一个元素相同的连续元素
   - 只移除连续重复的元素,非连续重复的元素会被保留
   - 保留 null 值（null 与 null 被认为是相同的）

2. 边界条件行为：
   - 当输入数组为空时，返回空数组
   - 当输入数组为 NULL 时，返回 NULL
   - 当数组中只有一个元素时，返回原数组

使用说明:

- 函数会保持原始数组元素的顺序
- 只移除连续重复的元素，不进行全局去重
- map，struct 不支持去重逻辑
- 对数组元素中的 null 值：null 元素会被正常处理，多个连续的 null 元素会被合并为一个

### 示例

```sql
CREATE TABLE array_compact_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_compact_test VALUES
(1, [1, 1, 2, 2, 2, 3, 1, 4], ['a', 'a', 'b', 'b', 'c']),
(2, [1, 2, 3, 1, 2, 3], ['a', 'b', 'a', 'b']),
(3, [1, null, null, 2, null, null, 3], ['a', null, null, 'b']),
(4, [], []),
(5, NULL, NULL);
```

**查询示例：**

string_array 连续重复去重：只有相邻的 'a' 或 'b' 会被去除，'c' 保留。
```sql
SELECT array_compact(string_array) FROM array_compact_test WHERE id = 1;
+-----------------------------+
| array_compact(string_array) |
+-----------------------------+
| ["a", "b", "c"]             |
+-----------------------------+
```

非连续重复元素不会被去除，原始顺序和内容保持。
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 2;
+-------------------------------+
| array_compact(int_array)      |
+-------------------------------+
| [1, 2, 3, 1, 2, 3]            |
+-------------------------------+
```

包含 null 的数组，连续 null 只保留一个：null 视为普通值，连续 null 只保留一个，非连续 null 不会被合并。
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 3;
+------------------------------------------+
| array_compact(int_array)                 |
+------------------------------------------+
| [1, null, 2, null, 3]                    |
+------------------------------------------+
```

复杂类型示例：

嵌套数组类型的连续重复去重。只有相邻的完全相同的子数组会被去除，非连续的不会。
```sql
SELECT array_compact([[1,2],[1,2],[3,4],[3,4]]);
+------------------------------------------+
| array_compact([[1,2],[1,2],[3,4],[3,4]]) |
+------------------------------------------+
| [[1,2],[3,4]]                            |
+------------------------------------------+
```

空数组返回空数组：
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 4;
+----------------------+
| array_compact(int_array) |
+----------------------+
| []                   |
+----------------------+
```

NULL 数组返回 NULL：
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 5;
+----------------------+
| array_compact(int_array) |
+----------------------+
| NULL                 |
+----------------------+
```

只有一个元素的数组返回原数组：
```sql
SELECT array_compact([42]);
+----------------------+
| array_compact([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

传入多个参数时会报错。
```sql
SELECT array_compact([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_compact' which has 2 arity. Candidate functions are: [array_compact(Expression)]
```

传入非数组类型时会报错。
```sql
SELECT array_compact('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_compact(VARCHAR(12))
```

### keywords

ARRAY, COMPACT, ARRAY_COMPACT 