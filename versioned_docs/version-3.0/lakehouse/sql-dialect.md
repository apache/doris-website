---
{
    "title": "SQL Converter for Apache Doris",
    "language": "en"
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

# SQL Dialect

:::tip
Starting from version 2.1, Doris can support multiple SQL dialects, such as Presto, Trino, Hive, PostgreSQL, Spark, Oracle, Clickhouse, and more. Through this feature, users can directly use the corresponding SQL dialect to query data in Doris, which facilitates users to smoothly migrate their original business to Doris.
:::

:::caution
This function is currently an experimental function. If you encounter any problems during use, you are welcome to provide feedback through the mail group, [GitHub issue](https://github.com/apache/doris/issues)
:::

## Deploy service

1. Download latest [SQL Converter for Apache Doris](https://www.selectdb.com/tools/doris-sql-convertor)


    :::info NOTE
    The SQL dialect conversion tool is based on the open-source [SQLGlot](https://github.com/tobymao/sqlglot) and has been further developed by SelectDB. For more information about SQLGlot, please refer to the [SQLGlot official website](https://sqlglot.com/sqlglot.html).
The SQL Convertor is not maintained or endorsed by Apache Doris; these efforts are supervised by Committers and the Doris PMC. The use of these resources and services is entirely at your own discretion, and the community does not verify the licensing or validity of these tools.
    :::

2. On any FE node, start the service through the following command:

	```shell
    # Configuring the service port
    vim apiserver/conf/config.conf
    # Start the SQL Converter for Apache Doris conversion service
    sh apiserver/bin/start.sh
    # If you need a front-end interface, you can configure the corresponding port in the webserver and start it. If you don't need a front-end, you can ignore the following operations.
    vim webserver/conf/config.conf
    # Start the front-end interface
    sh webserver/bin/start.sh
    ```
	

    :::tip
	  1. This service is a stateless service and can be started and stopped at any time.
	
	  2. Configure port in `apiserver/conf/config.conf` to specify any available port, and configure workers to specify the number of threads to start. In concurrent scenarios, you can adjust as needed, the default is 1.
	
	  3. It is recommended to start a separate service on each FE node.

    4. If you need to start the front-end interface, you can configure the SQL Converter for Apache Doris conversion service address in `webserver/conf/config`.conf. The default is `API_HOST=http://127.0.0.1:5001`
    :::


3. Start the Doris cluster (version 2.1 or higher)
4. Set the URL of the SQL Dialect Conversion Service with the following command in Doris:

	`MySQL> set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"`

	- `127.0.0.1:5001` is the deployment node IP and port of the SQL dialect conversion service.
	
## Use SQL dialect

Currently supported dialect types include:

- `presto`
- `trino`
- `clickhouse`
- `hive`
- `spark`
- `postgres`
- `oracle`

example:

- Presto

```sql
mysql> CREATE TABLE  test_sqlconvert (
         id int,
         start_time DateTime,
         value String,
         arr_int ARRAY<Int>,
         arr_str ARRAY<String>
     ) ENGINE=OLAP
     DUPLICATE KEY(`id`)
     COMMENT 'OLAP'
     DISTRIBUTED BY HASH(`id`) BUCKETS 1
     PROPERTIES (
     "replication_allocation" = "tag.location.default: 1"
     );
Query OK, 0 rows affected (0.01 sec)

mysql> INSERT INTO test_sqlconvert values(1, '2024-05-20 13:14:52', '2024-01-14',[1, 2, 3, 3], ['Hello', 'World']);
Query OK, 1 row affected (0.08 sec)

mysql> set sql_dialect=presto;
Query OK, 0 rows affected (0.00 sec)

mysql> SELECT cast(start_time as varchar(20)) as col1,
            array_distinct(arr_int) as col2,
            FILTER(arr_str, x -> x LIKE '%World%') as col3,
            to_date(value,'%Y-%m-%d') as col4,
            YEAR(start_time) as col5,
            date_add('month', 1, start_time) as col6,
            REGEXP_EXTRACT_ALL(value, '-.') as col7,
            JSON_EXTRACT('{"id": "33"}', '$.id')as col8,
            element_at(arr_int, 1) as col9,
            date_trunc('day',start_time) as col10
         FROM test_sqlconvert
         where date_trunc('day',start_time)= DATE'2024-05-20'     
     order by id;
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| col1                | col2      | col3      | col4       | col5 | col6                | col7        | col8 | col9 | col10               |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| 2024-05-20 13:14:52 | [1, 2, 3] | ["World"] | 2024-01-14 | 2024 | 2024-06-20 13:14:52 | ['-0','-1'] | "33" |    1 | 2024-05-20 00:00:00 |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
1 row in set (0.03 sec)

```

### Clickhouse

```sql
mysql> set sql_dialect=clickhouse;
Query OK, 0 rows affected (0.00 sec)

mysql> select  toString(start_time) as col1,
             arrayCompact(arr_int) as col2,
             arrayFilter(x -> x like '%World%',arr_str)as col3,
             toDate(value) as col4,
             toYear(start_time)as col5,
             addMonths(start_time, 1)as col6,
             extractAll(value, '-.')as col7,
             JSONExtractString('{"id": "33"}' , 'id')as col8,
             arrayElement(arr_int, 1) as col9,
             date_trunc('day',start_time) as col10
          FROM test_sqlconvert
          where date_trunc('day',start_time)= '2024-05-20 00:00:00'     
     order by id;
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| col1                | col2      | col3      | col4       | col5 | col6                | col7        | col8 | col9 | col10               |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| 2024-05-20 13:14:52 | [1, 2, 3] | ["World"] | 2024-01-14 | 2024 | 2024-06-20 13:14:52 | ['-0','-1'] | "33" |    1 | 2024-05-20 00:00:00 |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
1 row in set (0.02 sec)
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
    | `enable_sql_convertor_features` | `set enable_sql_convertor_features="ctas"` | Session variable, user-specified to enable certain special features of sql converter. `ctas`: Allows conversion of the `SELECT` part of a `CTAS` statement. (This variable is supported since Doris 3.0.7 and SQL Convertor 1.0.8.10)|
    | `sql_convertor_config` | `set sql_convertor_config = '{"ignore_udf": ["func1", "func2", "fucn3"]}'` | Session variable used to specify that SQL Convertor ignore some UDFs. SQL Convertor will not convert the functions in the list, otherwise it may report an error "Unknown Function". (This variable is supported since Doris 3.0.7 and SQL Convertor 1.0.8.10)|

