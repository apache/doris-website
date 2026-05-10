---
{
    "title": "MAP | Complex Types",
    "language": "zh-CN",
    "description": "介绍如何向 Apache Doris 的 MAP 类型字段导入数据，涵盖 CSV 与 JSON 两种格式的建表、Stream Load 命令与结果验证。",
    "keywords": [
        "Doris MAP 导入",
        "MAP 数据类型",
        "复杂类型导入",
        "Stream Load MAP",
        "CSV 导入 MAP",
        "JSON 导入 MAP",
        "半结构化数据"
    ],
    "sidebar_label": "MAP"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 复杂类型数据导入 / Stream Load 实操 -->

`MAP<K, V>` 表示由 `K, V` 类型元素组成的 `MAP`，常用于存储半结构化的键值对数据。点击 [MAP 数据类型](../../../sql-manual/basic-element/sql-data-types/semi-structured/MAP.md) 了解具体信息。

本文聚焦于 **如何把数据写入 MAP 类型字段**，提供两类常见数据源的端到端示例：

- [CSV 格式导入](#csv-格式导入)：适合上游为分隔符文本（注意分隔符与 MAP 内逗号的冲突）。
- [JSON 格式导入](#json-格式导入)：适合上游为 JSON 数组或 JSON Lines。

两类导入均使用 [Stream Load](../import-way/stream-load-manual.md) 接口，通用步骤为：

1. 准备数据文件
2. 在数据库中建表
3. 通过 `curl` 调用 Stream Load 导入
4. 查询结果以校验

## CSV 格式导入

### 第 1 步：准备数据

创建如下的 CSV 文件 `test_map.csv`。其中字段分隔符使用 `|` 而不是逗号，以便和 MAP 内部的逗号区分。

```text
1|{"Emily":101,"age":25}
2|{"Benjamin":102}
3|{}
4|null
```

文件中各行的语义如下：

| 行 | 含义 |
| --- | --- |
| `1\|{"Emily":101,"age":25}` | 包含两个键值对的 MAP |
| `2\|{"Benjamin":102}` | 包含一个键值对的 MAP |
| `3\|{}` | 空 MAP |
| `4\|null` | NULL 值 |

### 第 2 步：在数据库中建表

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 第 3 步：导入数据

通过 Stream Load 将 CSV 文件导入，关键 Header 含义见下表。

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_map" \
        -T "test_map.csv" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

| Header | 作用 |
| --- | --- |
| `column_separator:|` | 指定列分隔符为 `|`，避免与 MAP 内逗号冲突 |
| `columns: id, c_map` | 声明文件列与表列的映射关系 |

### 第 4 步：检查导入数据

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```

## JSON 格式导入

### 第 1 步：准备数据

创建如下的 JSON 文件 `test_map.json`，整体为 JSON 数组，每个元素对应一行数据。

```json
[
    {"id":1, "c_map":{"Emily":101, "age":25}},
    {"id":2, "c_map":{"Benjamin":102}},
    {"id":3, "c_map":{}},
    {"id":4, "c_map":null}
]
```

### 第 2 步：在数据库中建表

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 第 3 步：导入数据

通过 Stream Load 将 JSON 文件导入，关键 Header 含义见下表。

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_map" \
        -H "strip_outer_array:true" \
        -T "test_map.json" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

| Header | 作用 |
| --- | --- |
| `format:json` | 声明数据格式为 JSON |
| `strip_outer_array:true` | 当输入为 JSON 数组时，按数组元素逐行解析 |
| `columns: id, c_map` | 声明 JSON 字段与表列的映射关系 |

### 第 4 步：检查导入数据

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```

## 常见问题

**Q1：CSV 中为什么不使用逗号作为列分隔符？**

MAP 字面量内部本身就使用逗号分隔多个键值对（例如 `{"Emily":101,"age":25}`）。如果列分隔符也使用逗号，会导致解析歧义。建议使用 `|`、`\t` 等不会出现在 MAP 内容中的字符。

**Q2：导入 JSON 数组时为什么要加 `strip_outer_array:true`？**

当 JSON 文件最外层是一个数组（如本文示例）时，需要设置 `strip_outer_array:true`，Doris 才会把数组中的每个元素当作一行数据处理。如果文件本身已是 JSON Lines（每行一个对象），则无需该参数。

**Q3：如何表示空 MAP 与 NULL？**

- 空 MAP：CSV 中写为 `{}`，JSON 中写为 `{}`。
- NULL 值：CSV 中写为 `null`，JSON 中写为 `null`，要求目标列允许 `NULL`。
