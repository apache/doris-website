---
{
    "title": "JSON",
    "language": "zh-CN"
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
5. 如果需要将 JSON 文件中根节点的 JSON 对象导入，jsonpaths 需要指定为`$.`或者`$`，如：`PROPERTIES("jsonpaths"="$.")`
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

## 使用示例

本节展示了不同导入方式下的 JSON 格式使用方法, 以及各种JSON格式下导入需要指定的参数(以stream load为例)。

### 参数使用说明

#### JSON格式相关参数

对于不同格式的JSON文件，控制导入时候读取方式的两个比较重要的参数：

- `strip_outer_array`
- `read_json_by_line`

**example1：多行JSON记录**

每行作为一个完整的JSON记录流式地导入，当用户未指定这两个参数的值时候，默认设置`read_json_by_line`为true，`strip_outer_array`为false，因此这种格式的JSON用户不需要对这两个参数做指定（显示指定`read_json_by_line`也是可以的）

```JSON
{"a": 1, "b": 11}
{"a": 2, "b": 12}
{"a": 3, "b": 13}
{"a": 4, "b": 14}
```

如果用户误设置`strip_outer_array`为true，会在`FirstErrorMsg`中看到`JSON data is not an array-object, strip_outer_array must be FALSE`这样的报错信息。

---

**example2：数组形式的JSON记录**

文件中JSON记录以数组的形式组织，需要用户指定`strip_outer_array`为true。

```JSON
[
    {"a": 1, "b": 11},
    {"a": 2, "b": 12}
]
```

如果用户误设置`read_json_by_line`为true，会在`FirstErrorMsg`中看到`Parse json data failed. code: 28...`这样的报错信息。

---

**example3：多行数组**

如果每一行以数组的形式记录多个JSON记录，需要用户显式的将两个参数都设置为true。

```JSON
[{"a": 1, "b": 11},{"a": 2, "b": 12}]
[{"a": 3, "b": 13},{"a": 4, "b": 14}]
```

如果用户少设置了`strip_outer_array`，会在`FirstErrorMsg`中看到`JSON data is array-object, strip_outer_array must be TRUE`这样的报错信息。而如果用户少设置了`read_json_by_line`，这里**只会导入第一行**的两个JSON记录，需要注意一下。

#### JSON path相关参数

在JSON导入的过程中，用户可以通过设置`jsonpaths`和`json_root`，来更自由地控制数据抽取的路径，以提供对嵌套JSON的一些复杂格式的导入支持。与之相关的另一个参数项是`columns`。

```sql
-- 表结构
CREATE TABLE example_table (
    a INT,
    b INT
)

-- JSON 数据
[
    {"id":1, "record":{"year":25, "name":"hiki"}},
    {"id":2, "record":{"year":20, "name":"ykk"}}
]
```

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths:[\"$.id\",\"$.record.year\"]" \
    -H "columns:b,a" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load

select * from example_table;
+------+------+
| a    | b    |
+------+------+
|   20 |    2 |
|   25 |    1 |
+------+------+
```

从上面这样的导入命令和导入后数据不难看出这几个参数的交互。可以假设JSON导入是先从JSON文件中把数据读取出来，组织成一个行数据数组，然后将每一行数据逐个导入到表中。其中从JSON文件到行数据数组的数据分布顺序就由`jsonpaths`和`json_root`来控制，上面的例子中，该数组每一行数据分布的顺序就是JSON文件中的`id`和`year`，将每一行的数据导入到表中各项数据的映射关系，则由`columns`来指定，上面的例子中将`id`的数据导入到`b`表项，将`year`的数据导入到`a`表项。

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
