---
{
    "title": "SQL Dialect",
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

# SQL Dialect

:::tip
Starting from version 2.1, Doris can support multiple SQL dialects, such as Presto, Trino, Hive, PostgreSQL, Spark, Oracle, Clickhouse, and more. Through this feature, users can directly use the corresponding SQL dialect to query data in Doris, which facilitates users to smoothly migrate their original business to Doris.
:::

:::caution
 1. This function is currently an experimental function. If you encounter any problems during use, you are welcome to provide feedback through the mail group, [GitHub issue](https://github.com/apache/doris/issues), etc. .

:::

## Deploy service

1. Download latest [Doris SQL Convertor](https://www.selectdb.com/tools/doris-sql-convertor)

    > Note:
    >
    > The SQL convertor tool is based on the open source [SQLGlot](https://github.com/tobymao/sqlglot). For more information about SQLGlot, please refer to [SQLGlot official website](https://sqlglot.com/sqlglot.html)

2. On any FE node, start the service through the following command:

	`sh start.sh`
	
    :::tip
	1. This service is a stateless service and can be started and stopped at any time.
	
	2. The default startup port is 5001, and the specified port can be configured in config.conf.
	
	3. It is recommended to start a separate service on each FE node.
    :::

3. Start the Doris cluster (version 2.1 or higher)
4. Set the URL of the SQL Dialect Conversion Service with the following command in Doris:

	`MySQL> set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"`

	:::tip
	1. `127.0.0.1:5001` is the deployment node IP and port of the SQL dialect conversion service.
    :::
	
## Use SQL dialect

Currently supported dialect types include:

- `presto`
- `trino`
- `hive`
- `spark`
- `postgres`
- `clickhouse`
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

