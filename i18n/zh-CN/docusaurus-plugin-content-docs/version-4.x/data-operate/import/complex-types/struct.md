---
{
    "title": "STRUCT 类型数据导入",
    "language": "zh-CN",
    "description": "介绍如何将 STRUCT 结构体类型数据通过 CSV、JSON 与 INSERT INTO 方式导入 Apache Doris，包含建表、Stream Load 与结果校验示例。",
    "keywords": [
        "STRUCT 导入",
        "复杂类型导入",
        "Doris STRUCT",
        "Stream Load STRUCT",
        "named_struct",
        "CSV 导入 STRUCT",
        "JSON 导入 STRUCT"
    ],
    "sidebar_label": "STRUCT"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 复杂类型数据导入 -->

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >` 表示由多个 Field 组成的结构体，也可被理解为多个列的集合。更多类型说明请参见 [STRUCT 数据类型](../../../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT.md)。

本文从典型用户场景出发，介绍如何将 STRUCT 数据导入 Apache Doris，覆盖以下两类常见数据格式：

- **CSV 格式导入**：适用于从文本文件、ETL 任务输出等场景导入。
- **JSON 格式导入**：适用于从 API、日志或半结构化数据源导入。

两种方式都通过 [Stream Load](../import-way/stream-load-manual.md) 完成，也支持通过 `INSERT INTO VALUES` 语句直接写入。

## 导入流程概览

无论使用何种数据格式，导入 STRUCT 类型数据均遵循以下 4 个步骤：

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 准备数据 | 按目标格式（CSV / JSON）构造测试数据文件 |
| 2 | 在数据库中建表 | 创建包含 `STRUCT` 字段的表结构 |
| 3 | 导入数据 | 使用 Stream Load 或 `INSERT INTO` 写入 |
| 4 | 检查导入数据 | 通过 `SELECT` 验证结果 |

## CSV 格式导入

### 第 1 步：准备数据

创建如下 CSV 文件 `test_struct.csv`。其中分隔符使用 `|` 而不是逗号，以便和 STRUCT 内部的逗号区分。

```text
1|{10, 3.14, "Emily"}
2|{4, 1.5, null}
3|{7, null, "Benjamin"}
4|{}
5|null
```

### 第 2 步：在数据库中建表

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 第 3 步：导入数据

使用 Stream Load 导入 CSV 文件：

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_struct" \
    -T "test_struct.csv" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

也可以使用 `INSERT INTO VALUES` 语句导入：

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### 第 4 步：检查导入数据

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.01 sec)
```

## JSON 格式导入

### 第 1 步：准备数据

创建如下 JSON 文件 `test_struct.json`：

```json
[
    {"id":1, "c_struct":{"f1":10, "f2":3.14, "f3":"Emily"}},
    {"id":2, "c_struct":{"f1":4, "f2":1.5, "f3":null}},
    {"id":3, "c_struct":{"f1":7, "f2":null, "f3":"Benjamin"}},
    {"id":4, "c_struct":{}},
    {"id":5, "c_struct":null}
]
```

### 第 2 步：在数据库中建表

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 第 3 步：导入数据

使用 Stream Load 导入 JSON 文件，需通过 `format:json` 指定格式，并通过 `strip_outer_array:true` 解析最外层 JSON 数组：

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_struct" \
    -H "strip_outer_array:true" \
    -T "test_struct.json" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

### 第 4 步：检查导入数据

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.00 sec)
```

## 关键参数说明

<!-- 知识类型: 配置参数 -->

下表列出 STRUCT 导入过程中常用的 Stream Load Header 参数：

| 参数 | 适用格式 | 说明 |
|------|----------|------|
| `column_separator` | CSV | 列分隔符。STRUCT 内部使用 `,`，建议外层使用 `|` 等其他字符避免歧义 |
| `columns` | CSV / JSON | 指定列与表字段的映射关系 |
| `format` | JSON | 指定导入文件格式为 `json` |
| `strip_outer_array` | JSON | 当 JSON 文件最外层为数组时设为 `true`，以按行解析 |

## 常见问题

<!-- 知识类型: 常见问题 -->

### 1. 为何 CSV 文件中需要使用 `|` 而不是 `,` 作为分隔符？

STRUCT 字段的字面量内部使用 `,` 分隔各个 Field（例如 `{10, 3.14, "Emily"}`）。如果外层列分隔符也使用 `,`，会与 STRUCT 内部分隔符冲突，导致解析错误。建议改用 `|`、`\t` 等不会出现在 STRUCT 内部的字符。

### 2. 如何在 SQL 中直接插入 STRUCT 值？

使用 `named_struct` 函数显式指定每个 Field 的名称与值，例如：

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### 3. STRUCT 字段允许哪些 NULL 形式？

| 数据形式 | 含义 |
|----------|------|
| `null` | 整个 STRUCT 列为 NULL |
| `{}` | STRUCT 存在，但所有 Field 为 NULL |
| `{10, null, "Emily"}` | 部分 Field 为 NULL，其余正常赋值 |

### 4. JSON 导入为何要设置 `strip_outer_array:true`？

当 JSON 文件以数组形式包裹多条记录（如 `[ {...}, {...} ]`）时，需要通过 `strip_outer_array:true` 让 Doris 去掉最外层数组并按行解析；否则导入会按整个数组作为单条记录处理。
