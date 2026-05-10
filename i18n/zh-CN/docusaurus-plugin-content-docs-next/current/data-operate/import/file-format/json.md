---
{
    "title": "JSON | File Format",
    "language": "zh-CN",
    "description": "Doris 导入 JSON 文件指南：覆盖三种 JSON 格式、jsonpaths/json_root 等参数配置，以及 Stream Load、Broker Load、Routine Load、TVF 的使用示例。",
    "keywords": [
        "Doris JSON 导入",
        "jsonpaths",
        "json_root",
        "strip_outer_array",
        "read_json_by_line",
        "Stream Load JSON",
        "Routine Load JSON",
        "嵌套 JSON 导入"
    ],
    "sidebar_label": "JSON"
}
---

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: JSON 数据导入 / 字段抽取 / 嵌套结构处理 -->

本文介绍如何在 Doris 中导入 JSON 格式的数据文件。Doris 支持标准 JSON 格式数据导入，通过参数配置可以灵活处理不同的 JSON 数据结构，并支持从 JSON 数据中抽取字段、解析嵌套结构等场景。

## 导入方式

以下导入方式支持 JSON 格式数据：

| 导入方式 | 适用场景 | 参数传递方式 |
|---|---|---|
| [Stream Load](../import-way/stream-load-manual) | 本地或客户端推送的小批量、近实时导入 | HTTP Header，例如 `-H "jsonpaths: $.data"` |
| [Broker Load](../import-way/broker-load-manual) | 从对象存储/HDFS 等批量导入大文件 | `PROPERTIES`，例如 `PROPERTIES("jsonpaths"="$.data")` |
| [Routine Load](../import-way/routine-load-manual) | 持续从 Kafka 等消息队列消费 JSON | `PROPERTIES`，例如 `PROPERTIES("jsonpaths"="$.data")` |
| [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) | 用 SQL 直接读取 S3 上的 JSON 文件 | TVF 参数，例如 `S3("jsonpaths"="$.data")` |
| [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) | 用 SQL 直接读取 HDFS 上的 JSON 文件 | TVF 参数 |

## 支持的 JSON 格式

Doris 支持以下三种 JSON 文件组织形式，分别对应不同的业务场景。

### 格式一：以 Array 表示的多行数据

适用于一次性批量导入多行数据。

要求：

- 根节点必须是数组
- 数组中每个元素是一个对象，表示一行数据
- 必须设置 `strip_outer_array=true`

示例数据：

```json
[
    {"id": 123, "city": "beijing"},
    {"id": 456, "city": "shanghai"}
]

// 支持嵌套结构
[
    {"id": 123, "city": {"name": "beijing", "region": "haidian"}},
    {"id": 456, "city": {"name": "beijing", "region": "chaoyang"}}
]
```

### 格式二：以 Object 表示的单行数据

适用于单行数据导入。

要求：

- 根节点必须是对象
- 整个对象表示一行数据
- 文件中一行只有一个 JSON 记录

示例数据：

```json
{"id": 123, "city": "beijing"}

// 支持嵌套结构
{"id": 123, "city": {"name": "beijing", "region": "haidian"}}
```

:::tip 注意
通常用于 Routine Load 导入方式，例如 Kafka 中的单条消息。
:::

### 格式三：以固定分隔符分隔的多行 Object 数据

适用于批量导入多行数据（每行一个独立的 JSON 对象，类似 NDJSON）。

要求：

- 每行是一个完整的 JSON 对象
- 可不显式设置 `read_json_by_line=true`，该配置默认启用
- 可通过 `line_delimiter` 参数指定行分隔符，默认为 `\n`

示例数据：

```json
{"id": 123, "city": "beijing"}
{"id": 456, "city": "shanghai"}
```

## 参数配置

### 各导入方式的参数支持矩阵

下表列出了不同导入方式对 JSON 相关参数的支持情况：

| 参数 | 默认值 | Stream Load | Broker Load | Routine Load | TVF |
|---|---|---|---|---|---|
| `jsonpaths` | 无 | 支持 | 支持 | 支持 | 支持 |
| `json_root` | 无 | 支持 | 支持 | 支持 | 支持 |
| `strip_outer_array` | false | 支持 | 支持 | 支持 | 支持 |
| `read_json_by_line` | true | 支持 | 不支持配置 | 不支持配置 | 支持 |
| `fuzzy_parse` | false | 支持 | 支持 | 不支持 | 支持 |
| `num_as_string` | false | 支持 | 支持 | 支持 | 支持 |
| 压缩格式 | plain | 支持 | 支持 | 不支持 | 支持 |

:::tip 参数传递与默认行为说明

1. Stream Load：参数直接通过 HTTP Header 指定，例如 `-H "jsonpaths: $.data"`
2. Broker Load：参数通过 `PROPERTIES` 指定，例如 `PROPERTIES("jsonpaths"="$.data")`
3. Routine Load：参数通过 `PROPERTIES` 指定，例如 `PROPERTIES("jsonpaths"="$.data")`
4. TVF：参数通过 TVF 语句指定，例如 `S3("jsonpaths"="$.data")`
5. 如需将 JSON 文件中根节点的 JSON 对象直接导入，`jsonpaths` 需指定为 `$.`，例如 `PROPERTIES("jsonpaths"="$.")`
6. `read_json_by_line` 默认为 true 的含义：如果导入时未指定 `strip_outer_array` 和 `read_json_by_line` 中任何一个，则 `read_json_by_line` 为 true
7. `read_json_by_line` 在 Broker Load 与 Routine Load 中不支持配置，强制设置为 true，开启流式读取以降低 BE 内存压力

:::

### 参数详细说明

#### jsonpaths

- **作用**：指定如何从 JSON 数据中抽取字段
- **类型**：字符串数组
- **默认值**：无，默认使用列名匹配
- **使用示例**：

    ```json
    -- 基本用法
    ["$.id", "$.city"]

    -- 嵌套结构
    ["$.id", "$.info.city", "$.data[0].name"]
    ```

#### json_root

- **作用**：指定 JSON 数据的解析起点
- **类型**：字符串
- **默认值**：无，默认从根节点开始解析
- **使用示例**：

    ```json
    -- 原始数据
    {
      "data": {
        "id": 123,
        "city": "beijing"
      }
    }

    -- 设置 json_root
    json_root = $.data
    ```

#### strip_outer_array

- **作用**：指定是否去除最外层的数组结构
- **类型**：布尔值
- **默认值**：false
- **使用示例**：

    ```json
    -- 原始数据
    [
      {"id": 1, "city": "beijing"},
      {"id": 2, "city": "shanghai"}
    ]

    -- 设置 strip_outer_array=true
    ```

#### read_json_by_line

- **作用**：指定是否按行读取 JSON 数据
- **类型**：布尔值
- **默认值**：false
- **使用示例**：

    ```json
    -- 原始数据（每行一个完整的 JSON 对象）
    {"id": 1, "city": "beijing"}
    {"id": 2, "city": "shanghai"}

    -- 设置 read_json_by_line=true
    ```

#### fuzzy_parse

- **作用**：加速 JSON 数据的导入效率
- **类型**：布尔值
- **默认值**：false
- **限制**：
    - Array 中每行数据的字段顺序必须完全一致
    - 通常与 `strip_outer_array` 配合使用
- **性能**：可提升 3-5 倍导入效率

#### num_as_string

- **作用**：指定是否将 JSON 中的数值类型以字符串形式解析
- **类型**：布尔值
- **默认值**：false
- **使用场景**：
    - 处理超出数值范围的大数
    - 避免数值精度损失
- **使用示例**：

    ```json
    -- 原始数据
    {
      "id": "12345678901234567890",
      "price": "99999999.999999"
    }
    -- 设置 num_as_string=true，price 字段将以字符串形式解析
    ```

### JSON Path 与 Columns 的关系

在数据导入过程中，`jsonpaths` 与 `columns` 各自承担不同的职责：

| 参数 | 职责 | 处理结果 |
|---|---|---|
| `jsonpaths` | 定义数据抽取规则 | 从 JSON 数据中按指定路径抽取字段，并按 `jsonpaths` 中定义的顺序重排列 |
| `columns` | 定义数据映射规则 | 将抽取出的字段映射到目标表的列，可进行列的重排和转换 |

两者是串行处理：

1. `jsonpaths` 先从源数据中抽取字段，形成一个有序的数据集
2. `columns` 再将这些数据映射到表的列中

如果不指定 `columns`，抽取的字段将按照表的列顺序直接映射。

#### 示例 1：仅使用 JSON Path

表结构和数据：

```sql
-- 表结构
CREATE TABLE example_table (
    k2 int,
    k1 int
);

-- JSON 数据
{"k1": 1, "k2": 2}
```

导入命令：

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

导入结果：

```text
+------+------+
| k1   | k2   |
+------+------+
|    2 |    1 |
+------+------+
```

#### 示例 2：使用 JSON Path + Columns

使用相同的表结构和数据，添加 `columns` 参数。

导入命令：

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -H "columns: k2, k1" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

导入结果：

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    2 |
+------+------+
```

#### 示例 3：字段重复使用

表结构和数据：

```sql
-- 表结构
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_copy int
);

-- JSON 数据
{"k1": 1, "k2": 2}
```

导入命令：

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" \
    -H "columns: k2, k1, k1_copy" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

导入结果：

```text
+------+------+---------+
| k2   | k1   | k1_copy |
+------+------+---------+
|    2 |    1 |       1 |
+------+------+---------+
```

#### 示例 4：嵌套字段映射

表结构和数据：

```sql
-- 表结构
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_nested1 int,
    k1_nested2 int
);

-- JSON 数据
{
    "k1": 1,
    "k2": 2,
    "k3": {
        "k1": 31,
        "k1_nested": {
            "k1": 32
        }
    }
}
```

导入命令：

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k3.k1\", \"$.k3.k1_nested.k1\"]" \
    -H "columns: k2, k1, k1_nested1, k1_nested2" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

导入结果：

```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```

## 使用示例

本节展示了不同导入方式下的 JSON 格式使用方法，可直接复制修改后使用。

### Stream Load 导入

```bash
# 使用 JSON Path
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "jsonpaths: [\"$.id\", \"$.city\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# 指定 JSON root
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "json_root: $.events" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# 按行读取 JSON
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "read_json_by_line: true" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load 导入

```sql
-- 使用 JSON Path
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/path/example.json")
    INTO TABLE example_table
    FORMAT AS "json"
    PROPERTIES
    (
        "jsonpaths" = "[\"$.id\", \"$.city\"]"
    )
)
WITH S3
(
    ...
);

-- 指定 JSON root
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/path/example.json")
    INTO TABLE example_table
    FORMAT AS "json"
    PROPERTIES
    (
        "json_root" = "$.events"
    )
)
WITH S3
(
    ...
);
```

### Routine Load 导入

```sql
-- 使用 JSON Path
CREATE ROUTINE LOAD example_db.example_job ON example_table
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]"
)
FROM KAFKA
(
    ...
);
```

### TVF 导入

```sql
-- 使用 JSON Path
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.json",
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]",
    ...
);

-- 指定 JSON root
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.json",
    "format" = "json",
    "json_root" = "$.events",
    ...
);
```

## 常见问题 (FAQ)

<!-- 知识类型: 故障排查 -->

### Q1：导入数组形式的 JSON 文件，所有数据被当作一行处理？

需要显式设置 `strip_outer_array=true`，否则 Doris 会把整个最外层数组当成一个 JSON 对象解析，导致数据无法按行写入。

### Q2：每行一个 JSON 对象（NDJSON）的文件应该如何导入？

直接按 [格式三](#格式三以固定分隔符分隔的多行-object-数据) 导入即可。`read_json_by_line` 默认开启，无需额外配置；如行分隔符不是 `\n`，可通过 `line_delimiter` 指定。

### Q3：如何将 JSON 文件根节点的 JSON 对象直接导入？

将 `jsonpaths` 设为 `$.`，例如 `PROPERTIES("jsonpaths"="$.")`。

### Q4：如何处理超大数值或高精度小数避免精度丢失？

设置 `num_as_string=true`，将 JSON 数值以字符串形式解析后再写入对应类型的列，可避免数值范围溢出和精度损失。

### Q5：Broker Load / Routine Load 为什么不允许配置 `read_json_by_line`？

为降低 BE 的内存压力，Broker Load 与 Routine Load 强制以流式按行读取，因此不支持显式配置 `read_json_by_line`。

### Q6：如何加速大量同结构 JSON 数组的导入？

启用 `fuzzy_parse=true` 并配合 `strip_outer_array=true` 使用，可获得 3-5 倍的导入性能提升。要求数组中每行数据的字段顺序完全一致。

### Q7：`jsonpaths` 与 `columns` 是什么关系，谁先生效？

`jsonpaths` 先从 JSON 中抽取字段并按其顺序排列，`columns` 再把这些字段映射到目标表列。详见 [JSON Path 与 Columns 的关系](#json-path-与-columns-的关系)。
