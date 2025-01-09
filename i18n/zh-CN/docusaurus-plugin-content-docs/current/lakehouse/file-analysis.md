---
{
    "title": "分析 S3/HDFS 上的文件",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

通过 Table Value Function 功能，Doris 可以直接将对象存储或 HDFS 上的文件作为 Table 进行查询分析。并且支持自动的列类型推断。

更多使用方式可参阅 Table Value Function 文档：

* [S3](../sql-manual/sql-functions/table-valued-functions/s3.md)：支持 S3 兼容的对象存储上的文件分析。

* [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md)：支持 HDFS 上的文件分析。

## 基础使用

这里我们通过 S3 Table Value Function 举例说明如何对对象存储上的文件进行分析。

### 查询

```sql
SELECT * FROM S3 (
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak'
    's3.secret_key'='sk'
)
```

其中 `S3(...)`是一个 TVF（Table Value Function）。Table Value Function 本质上是一张表，因此他可以出现在任意 SQL 语句中“表”可以出现的位置上。

TVF 的属性包括要分析的文件路径，文件格式、对象存储的连接信息等。其中文件路径（URI）可以使用通配符匹配多个文件，以下的文件路径都是合法的：

* 匹配指定的文件

  `s3://bucket/path/to/tvf_test/test.parquet`

* 匹配所有 `test_` 开头的文件

  `s3://bucket/path/to/tvf_test/test_*`

* 匹配所有 `.parquet` 后缀的文件

  `s3://bucket/path/to/tvf_test/*.parquet`

* 匹配 `tvf_test`目录下的所有文件

  `s3://bucket/path/to/tvf_test/*`

* 匹配文件名中包含 `test`的文件

  `s3://bucket/path/to/tvf_test/*test*`

### 自动推断文件列类型

可以通过 `DESC FUNCTION` 语法可以查看 TVF 的 Schema：

```sql
DESC FUNCTION s3 (
    "URI" = "s3://bucket/path/to/tvf_test/test.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style"="true"
);
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

Doris 根据以下规则推断 Schema：

* 对于 Parquet、ORC 格式，Doris 会根据文件元信息获取 Schema。

* 对于匹配多个文件的情况，会使用第一个文件的 Schema 作为 TVF 的 Schema。

* 对于 CSV、JSON 格式，Doris 会根据字段、分隔符等属性，解析**第一行数据**获取 Schema。

  默认情况下，所有列类型均为 `string`。可以通过 `csv_schema` 属性单独指定列名和列类型。Doris 会使用指定的列类型进行文件读取。格式如下：`name1:type1;name2:type2;...`。如：

  ```sql
  S3 (
      'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      's3.access_key' = 'ak'
      's3.secret_key'='sk',
      'format' = 'csv',
      'column_separator' = '|',
      'csv_schema' = 'k1:int;k2:int;k3:int;k4:decimal(38,10)'
  )
  ```

  当前支持的列类型名称如下：

  | 列类型名称        |
  | ------------ |
  | tinyint      |
  | smallint     |
  | int          |
  | bigint       |
  | largeint     |
  | float        |
  | double       |
  | decimal(p,s) |
  | date         |
  | datetime     |
  | char         |
  | varchar      |
  | string       |
  | boolean      |

* 对于格式不匹配的列（比如文件中为字符串，用户定义为 `int`；或者其他文件和第一个文件的 Schema 不相同），或缺失列（比如文件中有 4 列，用户定义了 5 列），则这些列将返回 `null`。

## 适用场景

### 查询分析

TVF 非常适用于对存储系统上的独立文件进行直接分析，而无需事先将数据导入到 Doris 中。

可以使用任意的 SQL 语句进行文件分析，如：

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak'
    's3.secret_key'='sk'
)
ORDER BY p_partkey LIMIT 5;
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

TVF 可以出现在 SQL 中，Table 能出现的任意位置。如 `CTE` 的 `WITH` 子句中，`FROM` 子句中等等。这样，您可以把文件当做一张普通的表进行任意分析。

您也可以用过 `CREATE VIEW` 语句为 TVF 创建一个逻辑视图。之后，可以像其他视图一样，对这个 TVF 进行访问、权限管理等操作，也可以让其他用户访问这个 View，而无需重复书写连接信息等属性。

```sql
-- Create a view based on a TVF
CREATE VIEW tvf_view AS 
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak'
    's3.secret_key'='sk'
);

-- Describe the view as usual
DESC tvf_view;

-- Query the view as usual
SELECT * FROM tvf_view;

-- Grant SELECT priv to other user on this view
GRANT SELECT_PRIV ON db.tvf_view TO other_user;
```

### 数据导入

TVF 可以作为 Doris 数据导入方式的一种。配合 `INSERT INTO SELECT` 语法，我们可以很方便的将文件导入到 Doris 中。

```sql
-- Create a Doris table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

-- 2. Load data into table from TVF
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak'
    's3.secret_key'='sk'
);
```

## 注意事项

1. 如果指定的 `uri` 匹配不到文件，或者匹配到的所有文件都是空文件，那么 TVF 将会返回空结果集。在这种情况下使用`DESC FUNCTION`查看这个 TVF 的 Schema，会得到一列虚拟的列`__dummy_col`，该列无意义，仅作为占位符使用。

2. 如果指定的文件格式为 `csv`，所读文件不为空文件但文件第一行为空，则会提示错误`The first line is empty, can not parse column numbers`，这是因为无法通过该文件的第一行解析出 Schema。
