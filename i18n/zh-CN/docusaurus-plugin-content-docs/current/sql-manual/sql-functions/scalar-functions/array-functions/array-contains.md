---
{
    "title": "ARRAY_CONTAINS",
    "language": "zh-CN",
    "description": "检查数组中是否包含指定的值。如果找到则返回 true，否则返回 false。如果数组为 NULL，则返回 NULL。"
}
---

## array_contains

<version since="1.2.0">


</version>

## 描述

检查数组中是否包含指定的值。如果找到则返回 true，否则返回 false。如果数组为 NULL，则返回 NULL。

## 语法

```sql
array_contains(ARRAY<T> arr, T value)
```

### 参数

- `arr`：ARRAY<T> 类型，要检查的数组。支持列名或常量值。
- `value`：T 类型，要查找的值。类型必须与数组元素类型兼容。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6

### 返回值

返回类型：BOOLEAN

返回值含义：
- true：如果数组中包含指定的值
- false：如果数组中不包含指定的值
- NULL：如果输入数组为 NULL

返回值行为说明：

1. 边界条件行为：
   - 当输入数组为空时，返回 false
   - 当输入数组为 NULL 时，返回 NULL
   - 当数组元素类型与查找值类型不匹配时，返回 false
   - 对数组元素中的 null 值：null 元素会被正常处理，可以查找数组中的 null 元素

2. 异常值行为：
   - 当数组元素是不支持的类型，返回不支持错误

3. 返回 NULL 的情况：
   - 当输入数组为 NULL

**类型兼容性规则：**
1. **数值类型兼容性**：
   - 整数类型之间可以进行比较（TINYINT、SMALLINT、INT、BIGINT、LARGEINT）
   - 浮点数类型之间可以进行比较（FLOAT、DOUBLE）
   - 十进制类型之间可以进行比较（DECIMAL32、DECIMAL64、DECIMAL128I、DECIMALV2、DECIMAL256）
   - 整数和浮点数之间可以进行比较
2. **字符串类型兼容性**：
   - CHAR、VARCHAR、STRING 类型之间可以进行比较
3. **日期时间类型兼容性**：
   - DATE 和 DATEV2 之间可以进行比较
   - DATETIME 和 DATETIMEV2 之间可以进行比较

### 示例

**建表示例**
```sql
CREATE TABLE array_contains_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

-- 插入测试数据
INSERT INTO array_contains_test VALUES
(1, [1000, 2000, 3000], ['apple', 'banana', 'cherry']),
(2, [], []),
(3, NULL, NULL);
(4, [1000, null, 3000], ['apple', null, 'cherry']);
```

**查询示例：**

检查数组中是否包含某个整数值:该示例返回 false，因为 5 不在 int_array 中。
```sql
SELECT array_contains(int_array, 5) FROM array_contains_test WHERE id = 1;
+-------------------------------+
| array_contains(int_array, 5)  |
+-------------------------------+
| 0                             |
+-------------------------------+
```

检查字符串数组中是否包含某个字符串:该示例返回 true，因为 'banana' 在 string_array 中。
```sql
SELECT array_contains(string_array, 'banana') FROM array_contains_test WHERE id = 1;
+------------------------------------------+
| array_contains(string_array, 'banana')   |
+------------------------------------------+
| 1                                        |
+------------------------------------------+
```

当前是空数组。该示例返回 false，因为空数组里面没有值。
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 2;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| 0                                |
+----------------------------------+
```

当前是 NULL 数组，该示例返回 NULL。
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 3;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

检查数组中是否包含 null
在本例中，value_expr 参数为 null，且数组中没有 null 元素，因此返回 false。
```sql
SELECT array_contains([1, 2, 3], null);
+---------------------------------+
| array_contains([1, 2, 3], null) |
+---------------------------------+
|                               0 |
+---------------------------------+
```

检查数组中是否包含 null
在本例中，value_expr 参数为 null，且数组中包含 SQL null 值，因此返回 true。
```sql
SELECT array_contains([null, 1, 2], null);
+------------------------------------+
| array_contains([null, 1, 2], null) |
+------------------------------------+
|                                  1 |
+------------------------------------+
```

当查找值类型与数组元素类型不兼容，返回 false。
```sql
SELECT array_contains([1, 2, 3], 'string');
+-------------------------------------+
| array_contains([1, 2, 3], 'string') |
+-------------------------------------+
| 0                                   |
+-------------------------------------+
```

当查找值类型无法和数组元素进行类型转换时, 会返回错误
```
SELECT array_contains([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TINYINT
```

不支持的复杂类型会报错。在本例中，数组为嵌套数组类型，返回不支持错误。
```sql
SELECT array_contains([[1,2],[2,3]], [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_contains(Array(Nullable(Array(Nullable(TINYINT)))), Array(Nullable(TINYINT)))
```

### 注意事项

性能考虑： 当处理大数组时，如果非常在意性能影响，可以使用倒排索引进行加速查询，但是有一些使用限制需要注意

1. 建立array 倒排索引的属性只能是不分词索引
2. array的元素类型 T 必须是满足能建立倒排索引的数据类型基础上才能对array 建立索引
3. 查询条件参数 T 如果是 NULL 则无法利用索引进行加速
4. 函数作为谓词过滤条件时才会进行索引加速

```sql
-- 建表示例
CREATE TABLE `test_array_index` (
    `apply_date` date NULL COMMENT '',
    `id` varchar(60) NOT NULL COMMENT '',
    `inventors` array<text> NULL COMMENT '' -- 建表时对array 列加不分词倒排索引
  ) ENGINE=OLAP
  DUPLICATE KEY(`apply_date`, `id`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`id`) BUCKETS 1
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1",
  "is_being_synced" = "false",
  "storage_format" = "V2",
  "light_schema_change" = "true",
  "disable_auto_compaction" = "false",
  "enable_single_replica_compaction" = "false"
  );
-- 查询示例
SELECT id, inventors FROM test_array_index WHERE array_contains(inventors, 'x') ORDER BY id;
```

### keywords

ARRAY, CONTAIN, CONTAINS, ARRAY_CONTAINS
