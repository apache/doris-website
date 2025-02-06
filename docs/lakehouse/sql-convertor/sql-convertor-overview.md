---
{
    "title": "SQL Dialect Conversion",
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

## Release Notes

[SQL Convertor Release Notes](https://docs.selectdb.com/docs/ecosystem/sql-converter/sql-converter-release-node)