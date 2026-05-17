---
{
    "title": "ARRAY | Complex Types",
    "language": "zh-CN",
    "description": "如何将 ARRAY 数组类型数据通过 CSV、JSON 格式 Stream Load 导入 Apache Doris，含建表、分隔符与参数示例。",
    "sidebar_label": "ARRAY",
    "keywords": [
        "ARRAY 导入",
        "数组类型",
        "复杂类型导入",
        "CSV 导入数组",
        "JSON 导入数组",
        "Stream Load",
        "ARRAY<T>",
        "Apache Doris 数组",
        "column_separator",
        "strip_outer_array"
    ]
}
---

<!-- 知识类型: 操作步骤 / 数据导入示例 -->
<!-- 适用场景: 将含数组字段的数据文件导入 Doris -->

`ARRAY<T>` 表示由 T 类型元素组成的数组，常用于存储标签、ID 列表、多值属性等场景。关于该类型的语法、限制与函数支持，请参阅 [ARRAY 数据类型](../../../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md)。

本文聚焦于**如何将包含 ARRAY 字段的数据导入 Doris**，按数据来源格式分别给出 CSV 与 JSON 两种典型场景的端到端示例。

## 适用场景

| 数据来源 | 推荐方案 | 关键参数 |
| --- | --- | --- |
| 由 `|`、`\t` 等分隔的文本文件 | CSV 格式 Stream Load | `column_separator` |
| 嵌套结构化的 JSON 数组 | JSON 格式 Stream Load | `format=json`、`strip_outer_array` |

通用步骤如下：

1. 准备符合格式的源数据文件
2. 在 Doris 中创建包含 `ARRAY<T>` 列的目标表
3. 通过 Stream Load 将文件导入
4. 查询并校验数据是否正确解析

## CSV 格式导入

### 第 1 步：准备数据

创建 CSV 文件 `test_array.csv`。由于数组元素本身使用逗号分隔，为避免与列分隔符冲突，这里使用 `|` 作为列分隔符：

```text
1|[1,2,3,4,5]
2|[6,7,8]
3|[]
4|null
```

### 第 2 步：在数据库中建表

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 第 3 步：导入数据

通过 Stream Load 导入，使用 `column_separator` 指定列分隔符为 `|`：

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_array" \
        -T "test_array.csv" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### 第 4 步：检查导入数据

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```

## JSON 格式导入

### 第 1 步：准备数据

创建 JSON 文件 `test_array.json`，最外层为对象数组：

```json
[
    {"id":1, "c_array":[1,2,3,4,5]},
    {"id":2, "c_array":[6,7,8]},
    {"id":3, "c_array":[]},
    {"id":4, "c_array":null}
]
```

### 第 2 步：在数据库中建表

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 第 3 步：导入数据

通过 Stream Load 导入，需要将 `format` 设置为 `json`，并使用 `strip_outer_array:true` 将最外层数组拆分为多行：

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_array" \
        -H "strip_outer_array:true" \
        -T "test_array.json" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### 第 4 步：检查导入数据

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```

## 关键参数说明

| 参数 | 适用格式 | 说明 |
| --- | --- | --- |
| `column_separator` | CSV | 列分隔符。当数组中包含逗号时，建议使用 `|`、`\t` 等字符，避免与数组元素分隔符冲突 |
| `columns` | CSV / JSON | 指定数据列与表列的映射顺序 |
| `format` | JSON | 设置为 `json` 表示按 JSON 格式解析输入 |
| `strip_outer_array` | JSON | 设为 `true` 时，会剥离最外层的 `[]`，将其中每个对象作为一行导入 |

## 常见问题

### 数组中含逗号时，CSV 列分隔符为什么不能用逗号？

`ARRAY` 在 CSV 文件中以 `[1,2,3]` 形式表示，元素之间用逗号分隔。如果列分隔符也是逗号，解析器无法区分数组内部分隔符与列分隔符，会导致解析错误。建议使用 `|`、`\t` 等不会出现在数组内容中的字符。

### 如何表示 NULL 数组与空数组？

- **NULL 数组**：直接写 `null`（CSV）或使用 JSON 字面量 `null`，导入后值为 `NULL`
- **空数组**：写为 `[]`，导入后值为 `[]`，二者语义不同

### JSON 文件最外层不是数组怎么办？

如果文件中每行是一个独立的 JSON 对象（JSON Lines），无需设置 `strip_outer_array`；只有在最外层为 `[ {...}, {...} ]` 形式时，才需要将 `strip_outer_array` 设置为 `true`。
