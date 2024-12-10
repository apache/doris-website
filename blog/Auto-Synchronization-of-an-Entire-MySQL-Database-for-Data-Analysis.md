---
{
    'title': 'Auto synchronization of an entire MySQL database for data analysis',
    'description': "Flink-Doris-Connector 1.4.0 allows users to ingest a whole database (MySQL or Oracle) that contains thousands of tables into Apache Doris, in one step.",
    'date': '2023-08-16',
    'author': 'Apache Doris',
    'tags': ['Tech Sharing'],
    "image": '/images/auto-synchronize.png'
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



Flink-Doris-Connector 1.4.0 allows users to ingest a whole database (**MySQL** or **Oracle**) that contains thousands of tables into [Apache Doris](https://doris.apache.org/zh-CN/), a real-time analytic database, **in one step**.

With built-in Flink CDC, the Connector can directly synchronize the table schema and data from the upstream source to Apache Doris, which means users no longer have to write a DataStream program or pre-create mapping tables in Doris. 

When a Flink job starts, the Connector automatically checks for data equivalence between the source database and Apache Doris. If the data source contains tables which do not exist in Doris, the Connector will automatically create those same tables in Doris, and utilizes the side outputs of Flink to facilitate the ingestion of multiple tables at once; if there is a schema change in the source, it will automatically obtain the DDL statement and make the same schema change in Doris. 

## Quick Start

Download Flink Doris Connector: https://doris.apache.org/download/

## How to Use It

For example, to ingest a whole MySQL database `mysql_db` into Doris (the MySQL table names start with `tbl` or `test`), simply execute the following command (no need to create the tables in Doris in advance):

```Shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-1.4.0.jar \
    mysql-sync-database \
    --database test_db \
    --mysql-conf hostname=127.0.0.1 \
    --mysql-conf username=root \
    --mysql-conf password=123456 \
    --mysql-conf database-name=mysql_db \
    --including-tables "tbl|test.*" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=123456 \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label1 \
    --table-conf replication_num=1 
```

To ingest an Oracle database: please refer to the [example code](https://github.com/apache/doris-flink-connector/pull/156).

## How It Performs

When it comes to synchronizing a whole database (containing hundreds or even thousands of tables, active or inactive), most users want it to be done within seconds. So we tested the Connector to see if it came up to scratch:

- 1000 MySQL tables, each having 100 fields. All tables were active (which meant they were continuously updated and each data writing involved over a hundred rows)
- Flink job checkpoint: 10s

Under pressure test, the system showed high stability, with key metrics as follows:

![Flink-Doris-Connector](/images/FDC_1.png)

![Flink-CDC](/images/FDC_2.png)

![Doris-Cluster-Compaction-Score](/images/FDC_3.png)

According to feedback from early adopters, the Connector has also delivered high performance and system stability in 10,000-table database synchronization in their production environment. This proves that the combination of Apache Doris and Flink CDC is capable of large-scale data synchronization with high efficiency and reliability.

## How It Benefits Data Engineers

Engineers no longer have to worry about table creation or table schema maintenance, saving them days of tedious and error-prone work. Previously in Flink CDC, you need to create a Flink job for each table and build a log parsing link at the source end, but now with whole-database ingestion, resouce consumption in the source database is largely reduced. It is also a unified solution for incremental update and full update.

## Other Features

**1. Joining dimension table and fact table**

The common practice is to put dimension tables in Doris and run join queries via the real-time stream of Flink. Based on the [Async I/O of Flink](https://nightlies.apache.org/flink/flink-docs-release-1.14/docs/dev/datastream/operators/asyncio/), Flink-Doris-Connector 1.4.0 implements asynchronous Lookup Join, so the Flink real-time stream won't be blocked due to queries. Also, the Connector allows you to combine mulitple queries into one big query, and send it to Doris at once for processing. This improves the efficiency and throughput of such join queries.

**2. Thrift** **SDK**

We introduced Thrift-Service SDK into the Connector so users no longer have to use Thrift plug-ins or configure a Thrift environment in compilation. This makes the compilation process much simpler.

**3. On-Demand Stream Load**

During data synchronization, when there is no new data ingestion, no Stream Load requests will be issued. This avoids unnecessary consumption of cluster resources.

**4. Polling of Backend Nodes**

For data ingestion, Doris calls a frontend node to obtain a list of the backend nodes, and randomly chooses one to launch an ingestion request. That backend node will be the Coordinator. Flink-Doris-Connector 1.4.0 allows users to enable the polling mechanism, which is to have a different backend node to be the Coordinator at each Flink checkpoint to avoid too much pressure on a single backend node for a long time.

**5. Support for More Data Types**

In addition to the common data types, Flink-Doris-Connector 1.4.0 supports DecimalV3/DateV2/DateTimev2/Array/JSON in Doris.

## Example Usage

**Read from Apache Doris:** 

You can read data from Doris via DataStream or FlinkSQL (bounded stream). Predicate pushdown is supported.

```Java
CREATE TABLE flink_doris_source (
    name STRING,
    age INT,
    score DECIMAL(5,2)
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'database.table',
      'username' = 'root',
      'password' = 'password',
      'doris.filter.query' = 'age=18'
);

SELECT * FROM flink_doris_source;
```

**Join dimension table and fact table**:

```Java
CREATE TABLE fact_table (
  `id` BIGINT,
  `name` STRING,
  `city` STRING,
  `process_time` as proctime()
) WITH (
  'connector' = 'kafka',
  ...
);

create table dim_city(
  `city` STRING,
  `level` INT ,
  `province` STRING,
  `country` STRING
) WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
  'lookup.jdbc.async' = 'true',
  'table.identifier' = 'dim.dim_city',
  'username' = 'root',
  'password' = ''
);

SELECT a.id, a.name, a.city, c.province, c.country,c.level 
FROM fact_table a
LEFT JOIN dim_city FOR SYSTEM_TIME AS OF a.process_time AS c
ON a.city = c.city
```

**Write to Apache Doris**: 

```Java
CREATE TABLE doris_sink (
    name STRING,
    age INT,
    score DECIMAL(5,2)
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'database.table',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label',
      //json write in
      'sink.properties.format' = 'json',
      'sink.properties.read_json_by_line' = 'true'
);
```

If you've got any questions, find Apache Doris developers on [Slack](https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw).

