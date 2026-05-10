---
{
    "title": "CSV",
    "language": "zh-CN",
    "description": "Doris 导入 CSV 文件完整指南：支持自定义分隔符、包围符、转义符、压缩格式，适用于 Stream Load、Broker Load 等多种导入方式。",
    "keywords": [
        "Doris CSV 导入",
        "CSV 格式参数",
        "column_separator",
        "line_delimiter",
        "enclose 包围符",
        "Stream Load CSV",
        "Broker Load CSV",
        "Routine Load CSV",
        "csv_with_names",
        "compress_type"
    ]
}
---

<!-- 知识类型: 操作指南 + 参数参考 -->
<!-- 适用场景: 数据导入 / 文件格式适配 -->

本文介绍如何在 Apache Doris 中导入 CSV 格式的数据文件。Doris 支持灵活的 CSV 格式配置，包括自定义行/列分隔符、字段包围符、转义符、跳过行数、压缩格式等，并提供多种导入方式以满足批量加载、实时流式接入和联邦查询等不同场景的数据导入需求。

## 快速导航

在开始之前，建议根据您的数据来源与时效性需求，先选择合适的导入方式，再参考对应章节的参数与示例：

- 本地小文件、HTTP 直推：使用 [Stream Load](../import-way/stream-load-manual)
- 对象存储/HDFS 大批量文件：使用 [Broker Load](../import-way/broker-load-manual)
- Kafka 实时数据流：使用 [Routine Load](../import-way/routine-load-manual)
- MySQL 客户端本地文件：使用 [MySQL Load](../import-way/mysql-load-manual)
- 直接通过 SQL 查询/落表外部存储文件：使用 [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) 或 [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## 支持的导入方式

Doris 提供以下方式导入 CSV 格式数据：

| 导入方式 | 适用场景 | 入口 |
|----------|----------|------|
| Stream Load | 通过 HTTP 推送本地文件或程序数据 | [Stream Load](../import-way/stream-load-manual) |
| Broker Load | 从 S3/HDFS 等远端存储批量导入 | [Broker Load](../import-way/broker-load-manual) |
| Routine Load | 从 Kafka 持续订阅并导入 | [Routine Load](../import-way/routine-load-manual) |
| MySQL Load | 通过 MySQL 协议导入本地文件 | [MySQL Load](../import-way/mysql-load-manual) |
| INSERT INTO FROM S3 TVF | 直接读取 S3 文件并插入表 | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | 直接读取 HDFS 文件并插入表 | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## CSV 格式参数

<!-- 知识类型: 配置参数 -->

### 各导入方式参数支持矩阵

下表汇总了不同导入方式中 CSV 格式参数的支持情况与对应写法：

| 参数 | 默认值 | Stream Load | Broker Load | Routine Load | MySQL Load | TVF |
|------|--------|-------------|-------------|--------------|------------|-----|
| 行分隔符 | `\n` | line_delimiter | LINES TERMINATED BY | 不支持 | LINES TERMINATED BY | line_delimiter |
| 列分隔符 | `\t` | column_separator | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | column_separator |
| 包围符 | 无 | enclose | PROPERTIES.enclose | PROPERTIES.enclose | PROPERTIES.enclose | enclose |
| 转义符 | `\` | escape | PROPERTIES.escape | PROPERTIES.escape | PROPERTIES.escape | escape |
| 跳过行数 | 0 | skip_lines | PROPERTIES.skip_lines | 不支持 | IGNORE LINES | skip_lines |
| 裁剪双引号 | false | trim_double_quotes | 不支持 | PROPERTIES.trim_double_quotes | 不支持 | trim_double_quotes |
| 压缩格式 | plain | compress_type | PROPERTIES.compress_type | 不支持 | 不支持 | compress_type |

:::tip 各导入方式的参数指定语法
1. **Stream Load**：参数直接通过 HTTP Header 指定，例如：`-H "line_delimiter:\n"`
2. **Broker Load**：参数通过 SQL 语句指定：
    - 分隔符通过 `COLUMNS TERMINATED BY`、`LINES TERMINATED BY` 指定
    - 其他参数通过 `PROPERTIES` 指定，例如：`PROPERTIES("compress_type"="gz")`
3. **Routine Load**：参数通过 SQL 语句指定：
    - 分隔符通过 `COLUMNS TERMINATED BY` 指定
    - 其他参数通过 `PROPERTIES` 指定，例如：`PROPERTIES("enclose"="\"")`
4. **MySQL Load**：参数通过 SQL 语句指定：
    - 分隔符通过 `LINES TERMINATED BY`、`COLUMNS TERMINATED BY` 指定
    - 其他参数通过 `PROPERTIES` 指定，例如：`PROPERTIES("escape"="\\")`
5. **TVF**：参数通过 TVF 语句指定，例如：`S3("line_delimiter"="\n")`
:::

### 参数详解

#### 行分隔符（line_delimiter）

- **作用**：指定导入文件中的换行符
- **默认值**：`\n`
- **特点**：支持多个字符组合作为换行符

**典型使用场景**：

- Linux/Unix 系统文件：

    ```text
    数据文件：
    张三，25\n
    李四，30\n

    参数设置：
    line_delimiter：\n (默认值，可不设置)
    ```

- Windows 系统文件：

    ```text
    数据文件：
    张三，25\r\n
    李四，30\r\n

    参数设置：
    line_delimiter：\r\n
    ```

- 特殊程序生成文件：

    ```text
    数据文件：
    张三，25\r
    李四，30\r

    参数设置：
    line_delimiter：\r
    ```

- 自定义多字符分隔符：

    ```text
    数据文件：
    张三，25||
    李四，30||

    参数设置：
    line_delimiter：||
    ```

#### 列分隔符（column_separator）

- **作用**：指定导入文件中的列分隔符
- **默认值**：`\t`（制表符）
- **特点**：
    - 支持可见和不可见字符
    - 支持多字符组合
    - 不可见字符需要使用 `\x` 前缀的十六进制表示
- **MySQL 协议特殊处理**：
    - 不可见字符需要额外增加反斜线
    - 例如 Hive 的 `\x01` 在 Broker Load 中需要写成 `\\x01`

**典型使用场景**：

- 常见可见字符：

    ```text
    数据文件：
    张三，25，北京
    李四，30，上海

    参数设置：
    column_separator：,
    ```

- 制表符（默认）：

    ```text
    数据文件：
    张三    25    北京
    李四    30    上海

    参数设置：
    column_separator：\t (默认值，可不设置)
    ```

- Hive 文件（Stream Load）：

    ```text
    数据文件：
    张三\x0125\x01 北京
    李四\x0130\x01 上海

    参数设置：
    column_separator：\x01
    ```

- Hive 文件（Broker Load）：

    ```text
    数据文件：
    张三\x0125\x01 北京
    李四\x0130\x01 上海

    参数设置：
    PROPERTIES("column_separator"="\\x01")
    ```

- 多字符分隔符：

    ```text
    数据文件：
    张三||25||北京
    李四||30||上海

    参数设置：
    column_separator：||
    ```

#### 包围符（enclose）

- **作用**：保护包含特殊字符的字段，防止被错误解析
- **限制**：仅支持单字节字符
- **常用字符**：
    - 单引号：`'`
    - 双引号：`"`

**典型使用场景**：

- 字段包含列分隔符：

    ```text
    数据：a,'b,c',d
    列分隔符：,
    包围符：'
    解析结果：3 个字段 [a] [b,c] [d]
    ```

- 字段包含行分隔符：

    ```text
    数据：a,'b\nc',d
    列分隔符：,
    包围符：'
    解析结果：3 个字段 [a] [b\nc] [d]
    ```

- 字段既包含列分隔符又包含行分隔符：

    ```text
    数据：a,'b,c\nd,e',f
    列分隔符：,
    包围符：'
    解析结果：3 个字段 [a] [b,c\nd,e] [f]
    ```

#### 转义符（escape）

- **作用**：转义字段中与包围符相同的字符
- **限制**：仅支持单字节字符，默认为 `\`

**典型使用场景**：

- 字段包含包围符：

    ```text
    数据：a,'b,\'c',d
    列分隔符：,
    包围符：'
    转义符：\
    解析结果：3 个字段 [a] [b,'c] [d]
    ```

- 字段包含多个包围符：

    ```text
    数据：a,"b,\"c\"d",e
    列分隔符：,
    包围符："
    转义符：\
    解析结果：3 个字段 [a] [b,"c"d] [e]
    ```

- 字段包含转义符本身：

    ```text
    数据：a,'b\\c',d
    列分隔符：,
    包围符：'
    转义符：\
    解析结果：3 个字段 [a] [b\c] [d]
    ```

#### 跳过行数（skip_lines）

- **作用**：跳过 CSV 文件的前几行
- **类型**：整数类型
- **默认值**：0
- **特殊说明**：
    - 当 format 为 `csv_with_names` 时，系统会自动跳过首行（列名），忽略 skip_lines 参数
    - 当 format 为 `csv_with_names_and_types` 时，系统会自动跳过前两行（列名和类型），忽略 skip_lines 参数

**典型使用场景**：

- 跳过标题行：

    ```text
    数据文件：
    姓名，年龄，城市
    张三，25，北京
    李四，30，上海

    参数设置：
    skip_lines：1
    结果：跳过标题行，导入后续数据
    ```

- 跳过注释行：

    ```text
    数据文件：
    # 用户信息表
    # 创建时间：2024-01-01
    张三，25，北京
    李四，30，上海

    参数设置：
    skip_lines：2
    结果：跳过注释行，导入后续数据
    ```

- 使用 csv_with_names 格式：

    ```text
    数据文件：
    name,age,city
    张三，25，北京
    李四，30，上海

    参数设置：
    format：csv_with_names
    结果：系统自动跳过首行列名
    ```

- 使用 csv_with_names_and_types 格式：

    ```text
    数据文件：
    name,age,city
    string,int,string
    张三，25，北京
    李四，30，上海

    参数设置：
    format：csv_with_names_and_types
    结果：系统自动跳过前两行的列名和类型信息
    ```

#### 裁剪双引号（trim_double_quotes）

- **作用**：裁剪掉 CSV 文件每个字段最外层的双引号
- **类型**：布尔类型
- **默认值**：false

**典型使用场景**：

- 裁剪双引号：

    ```text
    数据文件：
    "张三","25","北京"
    "李四","30","上海"

    参数设置：
    trim_double_quotes：true
    结果：
    张三，25，北京
    李四，30，上海
    ```

#### 压缩格式（compress_type）

- **作用**：指定导入文件的压缩格式
- **类型**：字符串，忽略大小写
- **默认值**：plain
- **支持的压缩格式**：

    | 取值 | 说明 |
    |------|------|
    | plain | 不压缩（默认） |
    | bz2 | BZIP2 压缩 |
    | deflate | DEFLATE 压缩 |
    | gz | GZIP 压缩 |
    | lz4 | LZ4 Frame 格式压缩 |
    | lz4_block | LZ4 Block 格式压缩 |
    | lzo | LZO 压缩 |
    | lzop | LZOP 压缩 |
    | snappy_block | SNAPPY Block 格式压缩 |

- **注意事项**：
    - tar 是一种文件打包格式，不属于压缩格式，因此不支持 .tar 文件
    - 如需使用 tar 打包的文件，请先解包后再导入

## 使用示例

<!-- 知识类型: 操作步骤 -->

本节按导入方式分别展示最常见的三类操作：指定分隔符、处理带引号的数据、导入压缩文件。

### Stream Load 导入

```shell
# 指定分隔符
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "line_delimiter:\n" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# 处理带引号的数据
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "enclose:\"" \
    -H "escape:\\" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# 导入压缩文件
curl --location-trusted -u root: \
    -H "compress_type:gz" \
    -T example.csv.gz \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load
```

### Broker Load 导入

```sql
-- 指定分隔符
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    COLUMNS TERMINATED BY ","
    LINES TERMINATED BY "\n"
)
WITH S3
(
    ...
);

-- 处理带引号的数据
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    PROPERTIES
    (
        "enclose" = "\"",
        "escape" = "\\"
    )
)
WITH S3
(
    ...
);

-- 导入压缩文件
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv.gz")
    INTO TABLE test_table
    PROPERTIES
    (
        "compress_type" = "gz"
    )
)
WITH S3
(
    ...
);
```

### Routine Load 导入

```sql
-- 指定分隔符
CREATE ROUTINE LOAD test_db.test_job ON test_table
COLUMNS TERMINATED BY ","
FROM KAFKA
(
     ...
);

-- 处理带引号的数据
CREATE ROUTINE LOAD test_db.test_job ON test_table
COLUMNS TERMINATED BY ","
PROPERTIES
(
    "enclose" = "\"",
    "escape" = "\\"
)
FROM KAFKA
(
    ...
);
```

### MySQL Load 导入

```sql
-- 指定分隔符
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';

-- 处理带引号的数据
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
PROPERTIES
(
    "enclose" = "\"",
    "escape" = "\\"
);

-- 跳过表头
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
```

### TVF 导入

```sql
-- 指定分隔符
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv",
    "format" = "csv",
    "column_separator" = ",",
    "line_delimiter" = "\n"
    ...
);

-- 处理带引号的数据
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv",
    "format" = "csv",
    "column_separator" = ",",
    "enclose" = "\"",
    "escape" = "\\"
    ...
);

-- 导入压缩文件
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv.gz",
    "format" = "csv",
    "compress_type" = "gz"
    ...
);
```

## 常见问题

<!-- 知识类型: 故障排查 -->

**Q1：Hive 默认的 `\x01` 列分隔符在 Broker Load 中不生效？**

在 MySQL 协议下，不可见字符需要额外增加反斜线，应写成 `\\x01`，例如 `PROPERTIES("column_separator"="\\x01")`。Stream Load 通过 HTTP Header 指定时则使用 `\x01` 即可。

**Q2：Routine Load 是否支持自定义行分隔符？**

不支持。Routine Load 从 Kafka 消费的每条消息天然对应一行，因此不需要也不支持 `line_delimiter` 参数。

**Q3：CSV 文件首行是表头，如何在导入时跳过？**

- Stream Load / Broker Load / TVF：使用 `skip_lines=1`
- MySQL Load：使用 `IGNORE 1 LINES`
- 若文件同时遵循 `name1,name2,...` 表头约定，可将 `format` 设为 `csv_with_names`，系统会自动跳过首行；设为 `csv_with_names_and_types` 时会自动跳过前两行（列名 + 类型）

**Q4：可以直接导入 .tar 或 .tar.gz 文件吗？**

不可以。tar 是打包格式而非压缩格式，Doris 仅支持 `compress_type` 列出的压缩格式。.tar 或 .tar.gz 文件请先解包后再导入。

**Q5：字段中既包含列分隔符又包含换行符，应如何处理？**

为该字段设置 `enclose`（包围符）即可。例如使用单引号包围，`a,'b,c\nd,e',f` 在列分隔符为 `,`、包围符为 `'` 时会被正确解析为 3 个字段 `[a]`、`[b,c\nd,e]`、`[f]`。如果字段内还出现包围符本身，再配合 `escape`（转义符）使用。

**Q6：导入带双引号的字段时，如何去除最外层的双引号？**

将 `trim_double_quotes` 设为 `true`，Doris 会在解析后自动裁剪每个字段最外层的双引号。该参数在 Stream Load、Routine Load、TVF 中支持，Broker Load 与 MySQL Load 不支持。
