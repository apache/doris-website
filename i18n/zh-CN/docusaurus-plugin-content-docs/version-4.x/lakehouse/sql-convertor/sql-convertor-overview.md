---
{
    "title": "SQL 方言转换",
    "language": "zh-CN",
    "description": "从 2.1 版本开始，Doris 可以支持多种 SQL 方言，如 Presto、Trino、Hive、PostgreSQL、Spark、Clickhouse 等等。通过这个功能，用户可以直接使用对应的 SQL 方言查询 Doris 中的数据，方便用户将原先的业务平滑的迁移到 Doris 中。"
}
---

从 2.1 版本开始，Doris 可以支持多种 SQL 方言，如 Presto、Trino、Hive、PostgreSQL、Spark、Clickhouse 等等。通过这个功能，用户可以直接使用对应的 SQL 方言查询 Doris 中的数据，方便用户将原先的业务平滑的迁移到 Doris 中。

:::note
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

  - 自 3.0.7 版本开始，允许设置多个 url 地址，已提供高可用的 SQL 方言转换服务。详见 **相关参数** 部分介绍。

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
| --- | --- | --- | --- |
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

## 相关参数

- 变量

    | 变量名 | 示例 | 说明 |
    | ---    | ---  | ---  |
    | `sql_converter_service_url` | `set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"` | 全局变量，用于指定 sql convetor 服务地址 |
    | `sql_dialect` | `set sql_dialect=presto` | 会话变量，用于指定当前会话的方言 |
    | `serde_dialect` | `set serde_dialect=hive` | 会话变量，用于指定当前会话的序列化方言格式 |
    | `enable_sql_convertor_features` | `set enable_sql_convertor_features="ctas"` | 会话变量，用户指定开启 sql convertor 的某些特殊功能。`ctas`: 允许对 `CTAS` 语句中的 `SELECT` 部分进行转换。（该参数自 Doris 3.0.6 和 SQL Convertor 1.0.8.10 支持）|
    | `sql_convertor_config` | `set sql_convertor_config = '{"ignore_udf": ["func1", "func2", "fucn3"]}'` | 会话变量，用于指定 SQL Convertor 忽略一些 UDF。在列表中的函数，SQL Convertor 不会进行转换，否则可能报错 "Unknown Function" （该参数自 Doris 3.0.6 和 SQL Convertor 1.0.8.10 支持）|

    自 3.0.7 版本开始，允许设置多个 url 地址，以逗号分隔：

    ```
    set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert,"http://127.0.0.2:5001/api/v1/convert""
    ```

    Doris 会优先选择 `127.0.0.1` 的本地服务地址，当优先选择的地址不可用时，会自动切换到其他可用地址，以保证服务的可用性。

## 最佳实践

- 指定不需要转换的函数

    在某些情况下，可能无法在 Doris 中找到和原系统完全对应的函数，或者部分经过转换后的函数，在一些特殊参数下行为和原函数不完全一致。此时，用户可以先通过 UDF 来实现和原系统完全一致的函数，注册到 Doris 中。之后，在 `sql_convertor_config` 的 `ignore_udf` 中添加这个 UDF。这样，SQL Convetor 将不会对这个函数进行转换，以便用户可以使用 UDF 来控制函数行为。

## 版本变更记录

[SQL Convertor 版本变更记录](https://docs.selectdb.com/docs/ecosystem/sql-converter/sql-converter-release-node)

