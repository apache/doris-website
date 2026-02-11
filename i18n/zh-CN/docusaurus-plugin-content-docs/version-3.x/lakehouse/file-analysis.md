---
{
    "title": "分析 S3/HDFS 上的文件",
    "language": "zh-CN",
    "description": "了解如何使用 Apache Doris Table Value Function (TVF) 直接查询和分析 S3、HDFS 等存储系统上的 Parquet、ORC、CSV、JSON 文件，支持自动 Schema 推断、多文件匹配和数据导入。"
}
---

通过 Table Value Function（TVF）功能，Doris 可以直接将对象存储或 HDFS 上的文件作为表进行查询分析，无需事先导入数据，并且支持自动的列类型推断。

## 支持的存储系统

Doris 提供以下 TVF 用于访问不同的存储系统：

| TVF | 支持的存储 | 说明 |
|-----|-----------|------|
| [S3](../sql-manual/sql-functions/table-valued-functions/s3.md) | S3 兼容的对象存储 | 支持 AWS S3、阿里云 OSS、腾讯云 COS 等 |
| [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md) | HDFS | 支持 Hadoop 分布式文件系统 |
| [HTTP](../sql-manual/sql-functions/table-valued-functions/http.md) | HTTP | 支持从 HTTP 地址访问文件（自 4.0.2 版本起） |
| [FILE](../sql-manual/sql-functions/table-valued-functions/file.md) | S3/HDFS/HTTP/Local | 统一表函数，支持多种存储（自 3.1.0 版本起） |

## 使用场景

### 场景一：直接查询分析文件

TVF 非常适用于对存储系统上的文件进行直接分析，无需事先将数据导入到 Doris 中。

以下示例通过 S3 TVF 查询对象存储上的 Parquet 文件：

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
)
ORDER BY p_partkey LIMIT 5;
```

查询结果示例：

```
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```

TVF 本质上是一张表，可以出现在任意 SQL 语句中"表"可以出现的位置，如：

- `FROM` 子句中
- `CTE` 的 `WITH` 子句中
- `JOIN` 语句中

### 场景二：创建视图简化访问

通过 `CREATE VIEW` 语句可以为 TVF 创建逻辑视图，避免重复书写连接信息，并支持权限管理：

```sql
-- 基于 TVF 创建视图
CREATE VIEW tvf_view AS 
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);

-- 查看视图结构
DESC tvf_view;

-- 查询视图
SELECT * FROM tvf_view;

-- 授权其他用户访问
GRANT SELECT_PRIV ON db.tvf_view TO other_user;
```

### 场景三：导入数据到 Doris

配合 `INSERT INTO SELECT` 语法，可以将文件数据导入到 Doris 表中：

```sql
-- 1. 创建目标表
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

-- 2. 通过 TVF 导入数据
INSERT INTO test_table (id, name, age)
SELECT cast(id as INT) as id, name, cast(age as INT) as age
FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

## 核心功能

### 多文件匹配

文件路径（URI）支持使用通配符和范围模式匹配多个文件：

| 模式 | 示例 | 匹配结果 |
|------|------|----------|
| `*` | `file_*` | 所有以 `file_` 开头的文件 |
| `{n..m}` | `file_{1..3}` | `file_1`、`file_2`、`file_3` |
| `{a,b,c}` | `file_{a,b}` | `file_a`、`file_b` |

完整语法请参阅[文件路径模式](../sql-manual/basic-element/file-path-pattern)。

### 使用 Resource 简化配置

TVF 支持通过 `resource` 属性引用预先创建的 S3 或 HDFS Resource，从而避免在每次查询时重复填写连接信息。

**1. 创建 Resource**

```sql
CREATE RESOURCE "s3_resource"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.bucket" = "bucket"
);
```

**2. 在 TVF 中使用 Resource**

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    'resource' = 's3_resource'
);
```

:::tip
- Resource 中的属性会作为默认值，TVF 中指定的属性会覆盖 Resource 中的同名属性
- 使用 Resource 可以集中管理连接信息，便于维护和权限控制
:::

### 自动推断 Schema

通过 `DESC FUNCTION` 语法可以查看 TVF 自动推断的 Schema：

```sql
DESC FUNCTION s3 (
    "URI" = "s3://bucket/path/to/tvf_test/test.parquet",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true"
);
```

```
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

**Schema 推断规则：**

| 文件格式 | 推断方式 |
|----------|----------|
| Parquet、ORC | 根据文件元信息自动获取 Schema |
| CSV、JSON | 解析第一行数据获取 Schema，默认列类型为 `string` |
| 多文件匹配 | 使用第一个文件的 Schema |

### 手动指定列类型（CSV/JSON）

对于 CSV 和 JSON 格式，可以通过 `csv_schema` 属性手动指定列名和列类型，格式为 `name1:type1;name2:type2;...`：

```sql
S3 (
    'uri' = 's3://bucket/path/to/tvf_test/test.csv',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    'format' = 'csv',
    'column_separator' = '|',
    'csv_schema' = 'k1:int;k2:int;k3:int;k4:decimal(38,10)'
)
```

**支持的列类型：**

| 整数类型 | 浮点类型 | 其他类型 |
|----------|----------|----------|
| tinyint | float | decimal(p,s) |
| smallint | double | date |
| int | | datetime |
| bigint | | char |
| largeint | | varchar |
| | | string |
| | | boolean |

:::note
- 如果列类型不匹配（如文件中为字符串，但指定为 `int`），该列返回 `null`
- 如果列数量不匹配（如文件有 4 列，但指定了 5 列），缺失的列返回 `null`
:::

## 注意事项

| 场景 | 行为 |
|------|------|
| `uri` 匹配不到文件或所有文件为空 | TVF 返回空结果集；使用 `DESC FUNCTION` 查看 Schema 会得到占位列 `__dummy_col` |
| CSV 文件第一行为空（文件非空） | 提示错误 `The first line is empty, can not parse column numbers` |
