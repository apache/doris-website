---
{
    "title": "SQL Dialect Conversion",
    "language": "en"
}
---

Starting from version 2.1, Doris can support multiple SQL dialects, such as Presto, Trino, Hive, PostgreSQL, Spark, Clickhouse, etc. With this feature, users can directly use the corresponding SQL dialect to query data in Doris, making it convenient for users to smoothly migrate their existing business to Doris.

:::notice
This feature is currently experimental. If you encounter any issues during use, feel free to provide feedback via mailing lists, [GitHub Issue](https://github.com/apache/doris/issues), etc.
:::

## Deploy Service

1. Download the latest version of [SQL Convertor](https://www.selectdb.com/tools/doris-sql-convertor)

    :::info
    The SQL dialect conversion tool is based on the open-source [SQLGlot](https://github.com/tobymao/sqlglot), and is further developed by SelectDB. For more information about SQLGlot, please refer to the [SQLGlot official website](https://sqlglot.com/sqlglot.html).  

    SQL Convertor is not maintained or endorsed by Apache Doris. These works are supervised by Committers and Doris PMC. Using these resources and services is entirely at your own discretion, and the community is not responsible for verifying the licensing or validity of these tools.
    :::

2. On any FE node, start the service with the following commands:

    ```shell
    # Configure service port
    vim apiserver/conf/config.conf

    # Start SQL Converter for Apache Doris conversion service
    sh apiserver/bin/start.sh

    # If a frontend interface is needed, configure the corresponding port in the webserver and start it. If no frontend is needed, you can ignore the following operations
    vim webserver/conf/config.conf

    # Start the frontend interface
    sh webserver/bin/start.sh
    ```

    :::tip
    - This service is stateless and can be started or stopped at any time.

    - Configure the port in `apiserver/conf/config.conf` to specify any available port, and configure workers to specify the number of threads to start. In concurrent scenarios, you can adjust as needed, with a default of 1.

    - It is recommended to start a separate service on each FE node.

    - If you need to start the frontend interface, you can configure the SQL Converter for Apache Doris conversion service address in `webserver/conf/config.conf`, with the default being `API_HOST=http://127.0.0.1:5001`
    :::

3. Start the Doris cluster (version 2.1 or higher)

4. Set the URL of the SQL dialect conversion service in Doris with the following command:

  `MySQL> set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"`

  - `127.0.0.1:5001` is the IP and port of the SQL dialect conversion service deployment node.

## Use SQL Dialects

Currently supported dialect types include:

- `presto`

- `trino`

- `clickhouse`

- `hive`

- `spark`

- `postgres`

Example:

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

## Serde Dialect

Different systems may have different display methods for different column types.

For example, for NULL values, Doris and Hive display as `null`, while Trino/Presto displays as `NULL`.

For Map types, Hive displays as `{1:null,2:null}`, while Trino/Presto displays as {1=NULL, 2=NULL}.

In order to ensure the consistency of user migration behavior to the greatest extent, Doris provides a dialect serialization mode option, which can return different display formats according to different modes.

```
SET serde_diactor=<dialect>;
```

Currently supported serialization mode types include:

- doris (default)
- hive
- presto/trino

> Note: This feature has been supported since version 3.0.6.

### Serde Comparison Table

The following table shows how various data types are displayed in different serialization modes. Types not listed have the same display method.

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

## Configurations

- Variables

    | Variable name | Example | Description |
    | --- | --- | --- |
    | `sql_converter_service_url` | `set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"` | Global variable, used to specify the sql converter service address |
    | `sql_dialect` | `set sql_dialect=presto` | Session variable, used to specify the dialect of the current session |
    | `serde_dialect` | `set serde_dialect=hive` | Session variable, used to specify the serialization dialect format of the current session |
    | `enable_sql_convertor_features` | `set enable_sql_convertor_features="ctas"` | Session variable, user-specified to enable certain special features of sql converter. `ctas`: Allows conversion of the `SELECT` part of a `CTAS` statement. (This variable is supported since Doris 3.0.6 and SQL Convertor 1.0.8.10)|
    | `sql_convertor_config` | `set sql_convertor_config = '{"ignore_udf": ["func1", "func2", "fucn3"]}'` | Session variable used to specify that SQL Convertor ignore some UDFs. SQL Convertor will not convert the functions in the list, otherwise it may report an error "Unknown Function". (This variable is supported since Doris 3.0.6 and SQL Convertor 1.0.8.10)|

## Best Practices

- Specify functions that do not need to be converted

    In some cases, you may not be able to find a function in Doris that is completely consistent with the original system, or some functions after conversion may not behave exactly the same as the original function under some special parameters. In this case, the user can first use UDF to implement a function that is completely consistent with the original system and register it in Doris. Then, add this UDF in `ignore_udf` of `sql_convertor_config`. In this way, SQL Convertor will not convert this function, so that users can use UDF to control the function behavior.

## Release Notes

[SQL Convertor Release Notes](https://docs.selectdb.com/docs/ecosystem/sql-converter/sql-converter-release-node)

