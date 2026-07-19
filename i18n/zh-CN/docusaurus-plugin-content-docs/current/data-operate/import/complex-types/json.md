---
{
    "title": "JSON | Complex Types",
    "language": "zh-CN",
    "description": "本文介绍 Apache Doris JSON 类型的特性、容量限制及 CSV/JSON 两种格式的 Stream Load 导入方法和示例。",
    "keywords": [
        "Doris JSON",
        "JSON 数据类型",
        "JSONB",
        "JSON 导入",
        "Stream Load JSON",
        "json_extract",
        "复杂类型导入",
        "半结构化数据"
    ],
    "sidebar_label": "JSON"
}
---

<!-- 知识类型: 数据类型说明 + 操作步骤 -->
<!-- 适用场景: 半结构化数据建模 / JSON 数据导入 -->

## 概述

`JSON` 是 Apache Doris 提供的复杂数据类型，使用二进制格式高效存储 JSON 数据，并通过 JSON 函数访问其内部字段。当业务需要存储半结构化数据（如埋点日志、用户属性、配置项等），且要求快速访问内部字段时，可选择该类型。

与使用 `String` 类型存储 JSON 字符串相比，`JSON` 类型具备以下优势：

1. **数据校验**：写入时自动进行 JSON 格式校验，避免脏数据落库。
2. **高效存取**：二进制存储格式更紧凑；通过 `json_extract` 等函数访问 JSON 字段，性能比 `get_json_xx` 函数快数倍。

### 容量限制

| 项目 | 默认值 | 最大值 | 调整方式 |
| --- | --- | --- | --- |
| 单个 JSON 字段大小 | 1 MB（1048576 字节） | 2 GB（2147483643 字节） | 调整 BE 配置 `string_type_length_soft_limit_bytes` |

:::caution[版本兼容性]
在 1.2.x 版本中，JSON 类型名为 `JSONB`。为兼容 MySQL，从 2.0.0 版本开始更名为 `JSON`，使用 `JSONB` 创建的旧表仍可正常使用。
:::

## 选择导入方式

根据数据源文件格式选择对应的导入方案：

| 源文件格式 | 适用场景 | 关键参数 |
| --- | --- | --- |
| CSV | 数据来自分隔符文件，每行一条记录 | `column_separator`（建议使用 `|` 等非逗号分隔符） |
| JSON | 数据已为 JSON 数组或 JSON Lines 格式 | `format:json`、`strip_outer_array:true` |

下文以 Stream Load 为例，分别演示两种方式的完整导入流程。

## 通过 CSV 格式导入

### 第 1 步：准备数据

创建 CSV 文件 `test_json.csv`。由于 JSON 内部使用逗号分隔字段，为避免冲突，此处使用 `|` 作为列分隔符：

```text
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "micheal", "age": null}
4|{"name": null, "age": null}
5|null
```

### 第 2 步：在数据库中建表

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 第 3 步：导入数据

使用 Stream Load 提交导入任务，注意通过 `column_separator` 指定列分隔符为 `|`：

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_json" \
    -T "test_json.csv" \
    http://localhost:8040/api/testdb/json_test/_stream_load
```

### 第 4 步：检查导入数据

```sql
SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | null                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## 通过 JSON 格式导入

### 第 1 步：准备数据

创建 JSON 文件 `test_json.json`，文件内容为 JSON 数组，每个元素对应一行记录：

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "micheal", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```

### 第 2 步：在数据库中建表

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 第 3 步：导入数据

使用 Stream Load 提交导入任务，须设置 `format:json`，并通过 `strip_outer_array:true` 展开外层数组：

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_json" \
    -H "strip_outer_array:true" \
    -T "test_json.json" \
    http://localhost:8040/api/testdb/json_test/_stream_load
```

### 第 4 步：检查导入数据

```sql
mysql> SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | NULL                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## 常见问题

<!-- 知识类型: 常见问题 -->

**Q1：JSON 字段最大可存储多大数据？**

默认上限为 1 MB（1048576 字节），可通过调整 BE 配置 `string_type_length_soft_limit_bytes` 提升至最大 2 GB（2147483643 字节）。

**Q2：1.2.x 版本中创建的 `JSONB` 字段升级后是否需要修改？**

无需修改。从 2.0.0 版本起类型更名为 `JSON`，但使用 `JSONB` 创建的旧表仍可继续正常读写。

**Q3：为什么推荐使用 `JSON` 类型而不是 `String` 存储 JSON？**

`JSON` 类型在写入时进行格式校验，避免脏数据；二进制存储更紧凑；通过 `json_extract` 等函数访问字段比 `get_json_xx` 函数快数倍。

**Q4：CSV 导入时为什么使用 `|` 分隔符？**

JSON 内部本身包含逗号，若使用逗号作为列分隔符将导致解析错误。建议选择 JSON 字符串中不会出现的字符（如 `|`）作为列分隔符。

**Q5：JSON 数组导入时为什么需要 `strip_outer_array:true`？**

该参数指示 Stream Load 将外层 JSON 数组展开，把数组中每个元素视为独立的一行进行导入；若不设置，整个数组将被作为单条记录处理。
