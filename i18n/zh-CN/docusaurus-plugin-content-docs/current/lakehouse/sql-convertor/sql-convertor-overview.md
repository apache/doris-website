---
{
    "title": "SQL 方言转换",
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

从 2.1 版本开始，Doris 可以支持多种 SQL 方言，如 Presto、Trino、Hive、PostgreSQL、Spark、Clickhouse 等等。通过这个功能，用户可以直接使用对应的 SQL 方言查询 Doris 中的数据，方便用户将原先的业务平滑的迁移到 Doris 中。

:::notice
该功能目前是实验性功能，您在使用过程中如遇到任何问题，欢迎通过邮件组、[GitHub Issue](https://github.com/apache/doris/issues) 等方式进行反馈。
:::

## 部署服务

1. 下载最新版本的 [SQL Convertor](https://www.selectdb.com/tools/doris-sql-convertor)

    :::info
    SQL 方言转换工具基于开源的 [SQLGlot](https://github.com/tobymao/sqlglot) ，由 SelectDB 进行二次开发，关于 SQLGlot 可参阅 [SQLGlot 官网](https://sqlglot.com/sqlglot.html)。  

    SQL Convertor 并非由 Apache Doris 维护或认可，这些工作由 Committers 和 Doris PMC 监督。使用这些资源和服务完全由您自行决定，社区不负责验证这些工具的许可或有效性。
    :::

2. 在任意 FE 节点，通过以下命令启动服务：

    ```shell
    # 配置服务端口
    vim apiserver/conf/config.conf

    # 启动 SQL Converter for Apache Doris 转换服务
    sh apiserver/bin/start.sh

    # 如需前端界面，可在 webserver 中配置相应的端口并启动，不需要前端则可以忽略以下操作
    vim webserver/conf/config.conf

    # 启动前端界面
    sh webserver/bin/start.sh
    ```

    :::tip
    - 该服务是一个无状态的服务，可随时启停

    - 在 `apiserver/conf/config.conf` 中配置 port 来指定任意一个可用端口，配置 workers 来指定启动的线程数量。在并发场景中，可以根据需要调整，默认为 1

    - 建议在每个 FE 节点都单独启动一个服务

    - 如需启动前端界面，可以在 `webserver/conf/config.conf` 中配置 SQL Converter for Apache Doris 转换服务地址，默认是 `API_HOST=http://127.0.0.1:5001`
    :::

3. 启动 Doris 集群（2.1 或更高版本）

4. 通过以下命令，在 Doris 中设置 SQL 方言转换服务的 URL：

  `MySQL> set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"`

  - `127.0.0.1:5001` 是 SQL 方言转换服务的部署节点 ip 和端口。

## 使用 SQL 方言

目前支持的方言类型包括：

- `presto`

- `trino`

- `clickhouse`

- `hive`

- `spark`

- `postgres`

示例：

### Presto

```sql
CREATE TABLE  test_sqlconvert (
    id INT,
    start_time DATETIME,
    value STRING,
    arr_int ARRAY<INT>,
    arr_str ARRAY<STRING>
) ENGINE=OLAP
DUPLICATE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_sqlconvert VALUES(1, '2024-05-20 13:14:52', '2024-01-14',[1, 2, 3, 3], ['Hello', 'World']);

SET sql_dialect = presto;

SELECT CAST(start_time AS varchar(20)) AS col1,
      array_distinct(arr_int) AS col2,
      FILTER(arr_str, x -> x LIKE '%World%') AS col3,
      to_date(value,'%Y-%m-%d') AS col4,
      YEAR(start_time) AS col5,
      date_add('month', 1, start_time) AS col6,
      REGEXP_EXTRACT_ALL(value, '-.') AS col7,
      JSON_EXTRACT('{"id": "33"}', '$.id')AS col8,
      element_at(arr_int, 1) AS col9,
      date_trunc('day',start_time) AS col10
    FROM test_sqlconvert
    WHERE date_trunc('day',start_time) = DATE '2024-05-20'     
ORDER BY id;
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| col1                | col2      | col3      | col4       | col5 | col6                | col7        | col8 | col9 | col10               |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| 2024-05-20 13:14:52 | [1, 2, 3] | ["World"] | 2024-01-14 | 2024 | 2024-06-20 13:14:52 | ['-0','-1'] | "33" |    1 | 2024-05-20 00:00:00 |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
```

### Clickhouse

```sql
SET sql_dialect = clickhouse;

SELECT toString(start_time) AS col1,
       arrayCompact(arr_int) AS col2,
       arrayFilter(x -> x LIKE '%World%',arr_str) AS col3,
       toDate(value) AS col4,
       toYear(start_time) AS col5,
       addMonths(start_time, 1) AS col6,
       extractAll(value, '-.') AS col7,
       JSONExtractString('{"id": "33"}' , 'id') AS col8,
       arrayElement(arr_int, 1) AS col9,
       date_trunc('day',start_time) AS col10
    FROM test_sqlconvert
    WHERE date_trunc('day',start_time)= '2024-05-20 00:00:00'     
ORDER BY id;
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| col1                | col2      | col3      | col4       | col5 | col6                | col7        | col8 | col9 | col10               |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| 2024-05-20 13:14:52 | [1, 2, 3] | ["World"] | 2024-01-14 | 2024 | 2024-06-20 13:14:52 | ['-0','-1'] | "33" |    1 | 2024-05-20 00:00:00 |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
```

## 版本变更记录

[SQL Convertor 版本变更记录](https://docs.selectdb.com/docs/ecosystem/sql-converter/sql-converter-release-node)

## 方言序列化

不同系统针对不同的列类型可能有不同的显示方式。

比如对于 NULL 值，Doris 和 Hive 显示为 `null`，而 Trino/Presto 显示为 `NULL`。

对于 Map 类型，Hive 显示为 `{1:null,2:null}`，而 Trino/Presto 显示为 {1=NULL, 2=NULL}。

为了最大程度保证用户迁移的行为一致性，Doris 提供了方言序列化模式选项，可以根据不同模式，返回不同的显示格式。

```
SET serde_diactor=<dialect>;
```

目前支持的序列化模式类型包括：

- doris（默认）
- hive
- presto/trino

> 注：该功能自 3.0.6 版本支持。

### 序列化格式对照表

以下表格显示了不同序列化模式下，各种数据类型的显示方式。未列举的类型表示显示方式一样。

| Type | Doris | Hive | Presto/Trino |
| --- | --- | --- | --- | --- | --- |
| `Bool` | `1`, `0` | `1`, `0` | `1`, `0` |
| `Integer` | `1`, `1000` | `1`, `1000` | `1`, `1000` |
| `Float/Decimal` | `1.2`, `3.00` | `1.2`, `3.00` | `1.2`, `3.00` |
| `Date/Datetime` | `2025-01-01`， `2025-01-01 10:11:11` |  `2025-01-01`， `2025-01-01 10:11:11` | `2025-01-01`， `2025-01-01 10:11:11` |
| `String` | `abc`, `中国` | `abc`, `中国` | `abc`, `中国` |
| `Null` | `null` | `null` | `NULL` |
| `Array<bool>` | `[1, 0]` | `[true,false]` | `[1, 0]` |
| `Array<int>` | `[1, 1000]` | `[1,1000]` | `[1, 1000]` |
| `Array<string>` | `["abc", "中国"]` | `["abc","中国"]` | `["abc", "中国"]` |
| `Array<date/datetime>` | `["2025-01-01", "2025-01-01 10:11:11"]` | `["2025-01-01","2025-01-01 10:11:11"]` | `["2025-01-01", "2025-01-01 10:11:11"]` |
| `Array<null>` | `[null]` | `[null]` | `[NULL]` |
| `Map<int, string>` | `{1:"abc", 2:"中国"}` |`{1:"abc",2:"中国"}` |`{1=abc, 2=中国}` |
| `Map<string, date/datetime>` | `{"k1":"2022-10-01", "k2":"2022-10-01 10:10:10"}` | `{"k1":"2022-10-01","k2":"2022-10-01 10:10:10"}` | `{k1=2022-10-01, k2=2022-10-01 10:10:10}` |
| `Map<int, null>` | `{1:null, 2:null}` | `{1:null,2:null}` | `{1=NULL, 2=NULL}` |
| `Struct<>` | Same as map | Same as map | Same as map | Same as map | |

