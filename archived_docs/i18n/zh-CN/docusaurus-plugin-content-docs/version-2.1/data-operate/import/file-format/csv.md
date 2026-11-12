---
{
    "title": "CSV",
    "language": "zh-CN",
    "description": "本文介绍如何在 Doris 中导入 CSV 格式的数据文件。Doris 支持灵活的 CSV 格式配置，包括自定义分隔符、字段包围符等，并提供多种导入方式以满足不同场景的数据导入需求。"
}
---

本文介绍如何在 Doris 中导入 CSV 格式的数据文件。Doris 支持灵活的 CSV 格式配置，包括自定义分隔符、字段包围符等，并提供多种导入方式以满足不同场景的数据导入需求。

## 导入方式

Doris 支持以下方式导入 CSV 格式数据：

- [Stream Load](../import-way/stream-load-manual)
- [Broker Load](../import-way/broker-load-manual)
- [Routine Load](../import-way/routine-load-manual)
- [MySQL Load](../import-way/mysql-load-manual)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## 参数配置

### 参数支持情况

下表列出了各种导入方式支持的 CSV 格式参数：

| 参数 | 默认值 | Stream Load | Broker Load | Routine Load | MySQL Load | TVF |
|------|---------|-------------|--------------|--------------|------------|-----|
| 行分隔符 | `\n` | line_delimiter | LINES TERMINATED BY | 不支持 | LINES TERMINATED BY | line_delimiter |
| 列分隔符 | `\t` | column_separator | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | column_separator |
| 包围符 | 无 | enclose | PROPERTIES.enclose | PROPERTIES.enclose | PROPERTIES.enclose | enclose |
| 转义符 | `\` | escape | PROPERTIES.escape | PROPERTIES.escape | PROPERTIES.escape | escape |
| 跳过行数 | 0 | skip_lines | PROPERTIES.skip_lines | 不支持 | IGNORE LINES | skip_lines |
| 裁剪双引号 | false | trim_double_quotes | 不支持 | PROPERTIES.trim_double_quotes | 不支持 | trim_double_quotes |
| 压缩格式 | plain | compress_type | PROPERTIES.compress_type | 不支持 | 不支持 | compress_type |

:::tip 注意
1. Stream Load：参数直接通过 HTTP Header 指定，如：`-H "line_delimiter:\n"`
2. Broker Load：参数通过 SQL 语句指定，其中：
   - 分隔符通过 `COLUMNS TERMINATED BY`, `LINES TERMINATED BY` 指定
   - 其他参数通过 `PROPERTIES` 指定，如：`PROPERTIES("compress_type"="gz")`
3. Routine Load：参数通过 SQL 语句指定，其中：
   - 分隔符通过 `COLUMNS TERMINATED BY` 指定
   - 其他参数通过 `PROPERTIES` 指定，如：`PROPERTIES("enclose"="\"")`
4. MySQL Load：参数通过 SQL 语句指定，其中：
   - 分隔符通过 `LINES TERMINATED BY`, `COLUMNS TERMINATED BY` 指定
   - 其他参数通过 `PROPERTIES` 指定，如：`PROPERTIES("escape"="\\")`
5. TVF：参数通过 TVF 语句指定，如：`S3("line_delimiter"="\n")`
:::

### 参数说明
#### 行分隔符
- 作用：指定导入文件中的换行符
- 默认值：`\n`
- 特点：支持多个字符组合作为换行符
- 使用场景和示例：
  - Linux/Unix 系统文件：
    ```
    数据文件：
    张三，25\n
    李四，30\n
    
    参数设置：
    line_delimiter：\n (默认值，可不设置)
    ```
  - Windows 系统文件：
    ```
    数据文件：
    张三，25\r\n
    李四，30\r\n
    
    参数设置：
    line_delimiter：\r\n
    ```
  - 特殊程序生成文件：
    ```
    数据文件：
    张三，25\r
    李四，30\r
    
    参数设置：
    line_delimiter：\r
    ```
  - 自定义多字符分隔符：
    ```
    数据文件：
    张三，25||
    李四，30||
    
    参数设置：
    line_delimiter：||
    ```

#### 列分隔符
- 作用：指定导入文件中的列分隔符
- 默认值：`\t`（制表符）
- 特点：
  - 支持可见和不可见字符
  - 支持多字符组合
  - 不可见字符需要使用 `\x` 前缀的十六进制表示
- MySQL 协议特殊处理：
  - 不可见字符需要额外增加反斜线
  - 如 Hive 的 `\x01` 在 Broker Load 中需要写成 `\\x01`
- 使用场景和示例：
  - 常见可见字符：
    ```
    数据文件：
    张三，25，北京
    李四，30，上海
    
    参数设置：
    column_separator：,
    ```
  - 制表符（默认）：
    ```
    数据文件：
    张三    25    北京
    李四    30    上海
    
    参数设置：
    column_separator：\t (默认值，可不设置)
    ```
  - Hive 文件（Stream Load）：
    ```
    数据文件：
    张三\x0125\x01 北京
    李四\x0130\x01 上海
    
    参数设置：
    column_separator：\x01
    ```
  - Hive 文件（Broker Load）：
    ```
    数据文件：
    张三\x0125\x01 北京
    李四\x0130\x01 上海
    
    参数设置：
    PROPERTIES("column_separator"="\\x01")
    ```
  - 多字符分隔符：
    ```
    数据文件：
    张三||25||北京
    李四||30||上海
    
    参数设置：
    column_separator：||
    ```

#### 包围符
- 作用：保护包含特殊字符的字段，防止被错误解析
- 限制：仅支持单字节字符
- 常用字符：
  - 单引号：`'`
  - 双引号：`"`
- 使用场景和示例：
  - 字段包含列分隔符：
    ```
    数据：a,'b,c',d
    列分隔符：,
    包围符：'
    解析结果：3 个字段 [a] [b,c] [d]
    ```
  - 字段包含行分隔符：
    ```
    数据：a,'b\nc',d
    列分隔符：,
    包围符：'
    解析结果：3 个字段 [a] [b\nc] [d]
    ```
  - 字段既包含列分隔符又包含行分隔符：
    ```
    数据：a,'b,c\nd,e',f
    列分隔符：,
    包围符：'
    解析结果：3 个字段 [a] [b,c\nd,e] [f]
    ```

#### 转义符
- 作用：转义字段中与包围符相同的字符
- 限制：仅支持单字节字符，默认为 `\`
- 使用场景和示例：
  - 字段包含包围符：
    ```
    数据：a,'b,\'c',d
    列分隔符：,
    包围符：'
    转义符：\
    解析结果：3 个字段 [a] [b,'c] [d]
    ```
  - 字段包含多个包围符：
    ```
    数据：a,"b,\"c\"d",e
    列分隔符：,
    包围符："
    转义符：\
    解析结果：3 个字段 [a] [b,"c"d] [e]
    ```
  - 字段包含转义符本身：
    ```
    数据：a,'b\\c',d
    列分隔符：,
    包围符：'
    转义符：\
    解析结果：3 个字段 [a] [b\c] [d]
    ```

#### 跳过行数
- 作用：跳过 CSV 文件的前几行
- 类型：整数类型
- 默认值：0
- 特殊说明：
  - 当 format 为 `csv_with_names` 时，系统会自动跳过首行（列名），忽略 skip_lines 参数
  - 当 format 为 `csv_with_names_and_types` 时，系统会自动跳过前两行（列名和类型），忽略 skip_lines 参数

- 使用场景和示例：
  - 跳过标题行：
    ```
    数据文件：
    姓名，年龄，城市
    张三，25，北京
    李四，30，上海
    
    参数设置：
    skip_lines：1
    结果：跳过标题行，导入后续数据
    ```
  - 跳过注释行：
    ```
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
    ```
    数据文件：
    name,age,city
    张三，25，北京
    李四，30，上海
    
    参数设置：
    format：csv_with_names
    结果：系统自动跳过首行列名
    ```
  - 使用 csv_with_names_and_types 格式：
    ```
    数据文件：
    name,age,city
    string,int,string
    张三，25，北京
    李四，30，上海
    
    参数设置：
    format：csv_with_names_and_types
    结果：系统自动跳过前两行的列名和类型信息
    ```

#### 裁剪双引号
- 作用：裁剪掉 CSV 文件每个字段最外层的双引号
- 类型：布尔类型
- 默认值：false
- 使用场景和示例：
  - 裁剪双引号：
    ```
    数据文件：
    "张三","25","北京"
    "李四","30","上海"
    
    参数设置：
    trim_double_quotes：true
    结果：
    张三，25，北京
    李四，30，上海
    ```
#### 压缩格式
- 作用：指定导入文件的压缩格式
- 类型：字符串，忽略大小写
- 默认值：plain
- 支持的压缩格式：
  - plain：不压缩（默认）
  - bz2：BZIP2 压缩
  - deflate：DEFLATE 压缩
  - gz：GZIP 压缩
  - lz4：LZ4 Frame 格式压缩
  - lz4_block：LZ4 Block 格式压缩
  - lzo：LZO 压缩
  - lzop：LZOP 压缩
  - snappy_block：SNAPPY Block 格式压缩
- 注意事项：
  - tar 是一种文件打包格式，不属于压缩格式，因此不支持 .tar 文件
  - 如需使用 tar 打包的文件，请先解包后再导入

## 使用示例

本节展示了不同导入方式下的 CSV 格式使用方法。

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
