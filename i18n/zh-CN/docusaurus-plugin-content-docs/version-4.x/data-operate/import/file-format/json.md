---
{
    "title": "JSON",
    "language": "zh-CN",
    "description": "本文介绍如何在 Doris 中导入 JSON 格式的数据文件。Doris 支持导入标准 JSON 格式数据，通过配置相关参数，可以灵活地处理不同的 JSON 数据结构，并支持从 JSON 数据中抽取字段、处理嵌套结构等场景。"
}
---

本文介绍如何在 Doris 中导入 JSON 格式的数据文件。Doris 支持导入标准 JSON 格式数据，通过配置相关参数，可以灵活地处理不同的 JSON 数据结构，并支持从 JSON 数据中抽取字段、处理嵌套结构等场景。

## 导入方式

以下导入方式支持 JSON 格式的数据导入：

- [Stream Load](../import-way/stream-load-manual)
- [Broker Load](../import-way/broker-load-manual)
- [Routine Load](../import-way/routine-load-manual)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## 支持的 JSON 格式

Doris 支持以下三种 JSON 格式：

### 以 Array 表示的多行数据

适用于批量导入多行数据，要求：
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

### 以 Object 表示的单行数据

适用于单行数据导入，要求：
- 根节点必须是对象
- 整个对象表示一行数据
- 文件中一行只有一个json记录

示例数据：
```json
{"id": 123, "city": "beijing"}

// 支持嵌套结构
{"id": 123, "city": {"name": "beijing", "region": "haidian"}}
```

:::tip 注意
通常用于 Routine Load 导入方式，如 Kafka 中的单条消息。
:::

### 以固定分隔符分隔的多行 Object 数据

适用于批量导入多行数据，要求：
- 每行是一个完整的 JSON 对象
- 可以不设置`read_json_by_line=true`, 默认启用该配置
- 可通过 `line_delimiter` 参数指定行分隔符，默认为 `\n`

示例数据：
```json
{"id": 123, "city": "beijing"}
{"id": 456, "city": "shanghai"}
```

## 参数配置

### 参数支持情况

下表列出了各种导入方式支持的 JSON 格式参数：

| 参数 | 默认值 | Stream Load | Broker Load | Routine Load | TVF |
|------|---------|-------------|--------------|--------------|-----|
| json_paths | 无 | 支持 | 支持 | 支持 | 支持 |
| json_root | 无 | 支持 | 支持 | 支持 | 支持 |
|strip_outer_array| false | 支持 | 支持 | 支持 | 支持 |
|read_json_by_line| true | 支持 | 不支持配置 | 不支持配置 | 支持 |
| fuzzy_parse | false | 支持 | 支持 | 不支持 | 支持 |
| num_as_string | false | 支持 | 支持 | 支持 | 支持 |
| 压缩格式 | plain | 支持 | 支持 | 不支持 | 支持 |

:::tip 注意
1. Stream Load：参数直接通过 HTTP Header 指定，如：`-H "jsonpaths: $.data"`
2. Broker Load：参数通过 `PROPERTIES` 指定，如：`PROPERTIES("jsonpaths"="$.data")`
3. Routine Load：参数通过 `PROPERTIES` 指定，如：`PROPERTIES("jsonpaths"="$.data")`
4. TVF：参数通过 TVF 语句指定，如：`S3("jsonpaths"="$.data")`
5. 如果需要将 JSON 文件中根节点的 JSON 对象导入，jsonpaths 需要指定为$.，如：`PROPERTIES("jsonpaths"="$.")`
6. read_json_by_line默认为true指的是如果导入时不指定strip_outer_array和read_json_by_line任何一个, 那么read_json_by_line为true.
7. read_json_by_line不支持配置指强制设置为true, 开启流式读取降低BE内存压力
:::

### 参数说明

#### JSON Path
- 作用：指定如何从 JSON 数据中抽取字段
- 类型：字符串数组
- 默认值：无，默认使用列名匹配
- 使用示例：
  ```json
  -- 基本用法
  ["$.id", "$.city"]
  
  -- 嵌套结构
  ["$.id", "$.info.city", "$.data[0].name"]
  ```

#### JSON Root
- 作用：指定 JSON 数据的解析起点
- 类型：字符串
- 默认值：无，默认从根节点开始解析
- 使用示例：
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

#### Strip Outer Array
- 作用：指定是否去除最外层的数组结构
- 类型：布尔值
- 默认值：false
- 使用示例：
  ```json
  -- 原始数据
  [
    {"id": 1, "city": "beijing"},
    {"id": 2, "city": "shanghai"}
  ]
  
  -- 设置 strip_outer_array=true
  ```

#### Read JSON By Line
- 作用：指定是否按行读取 JSON 数据
- 类型：布尔值
- 默认值：false
- 使用示例：
  ```json
  -- 原始数据（每行一个完整的 JSON 对象）
  {"id": 1, "city": "beijing"}
  {"id": 2, "city": "shanghai"}
  
  -- 设置 read_json_by_line=true
  ```

#### Fuzzy Parse
- 作用：加速 JSON 数据的导入效率
- 类型：布尔值
- 默认值：false
- 限制：
  - Array 中每行数据的字段顺序必须完全一致
  - 通常与 strip_outer_array 配合使用
- 性能：可提升 3-5 倍导入效率

#### Num As String
- 作用：指定是否将 JSON 中的数值类型以字符串形式解析
- 类型：布尔值
- 默认值：false
- 使用场景：
  - 处理超出数值范围的大数
  - 避免数值精度损失
- 使用示例：
  ```json
  -- 原始数据
  {
    "id": "12345678901234567890",
    "price": "99999999.999999"
  }
  -- 设置 num_as_string=true，price 字段将以字符串形式解析
  
  ```

### JSON Path 和 Columns 的关系

在数据导入过程中，JSON Path 和 Columns 各自承担不同的职责：

**JSON Path**：定义数据抽取规则
   - 从 JSON 数据中按指定路径抽取字段
   - 抽取的字段按 JSON Path 中定义的顺序进行重排列

**Columns**：定义数据映射规则
   - 将抽取的字段映射到目标表的列
   - 可以进行列的重排和转换

这两个参数的处理过程是串行的：首先 JSON Path 从源数据中抽取字段并形成有序的数据集，然后 Columns 将这些数据映射到表的列中。如果不指定 Columns，抽取的字段将按照表的列顺序直接映射。

#### 使用示例

##### 仅使用 JSON Path

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

##### 使用 JSON Path + Columns

使用相同的表结构和数据，添加 columns 参数：

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

##### 字段重复使用

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

##### 嵌套字段映射

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

本节展示了不同导入方式下的 JSON 格式使用方法。

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
