---
{
    'title': 'Building a data warehouse for traditional industry',
    'description': "The best component for you is the one that suits you most. In Midland Realty, we don't have too much data to process but want a data platform easy to use and maintain.",
    'date': '2023-05-12',
    'author': 'Herman Seah',
    'tags': ['Best Practice'],
    "image": '/images/building-a-data-warehouse-for-traditional-industry.png'
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

By Herman Seah, Data Warehouse Planner & Data Analyst at Midland Realty

This is a part of the digital transformation of a real estate giant. For the sake of confidentiality, I'm not going to reveal any business data, but you'll get a detailed view of our data warehouse and our optimization strategies.

Now let's get started.

## Architecture

Logically, our data architecture can be divided into four parts.

![data-processing-architecture](/images/Midland_1.png)

- **Data integration**: This is supported by Flink CDC, DataX, and the Multi-Catalog feature of Apache Doris.
- **Data management**: We use Apache Dolphinscheduler for script lifecycle management, privileges in multi-tenancy management, and data quality monitoring.
- **Alerting**: We use Grafana, Prometheus, and Loki to monitor component resources and logs.
- **Data services**: This is where BI tools step in for user interaction, such as data queries and analysis.

### 1. **Tables**

We create our dimension tables and fact tables centering each operating entity in business, including customers, houses, etc. If there are a series of activities involving the same operating entity, they should be recorded by one field. (This is a lesson learned from our previous chaotic data management system.)

### 2. **Layers**

Our data warehouse is divided into five conceptual layers. We use Apache Doris and Apache DolphinScheduler to schedule the DAG scripts between these layers.

![ODS-DWD-DWS-ADS-DIM](/images/Midland_2.png)

Every day, the layers go through an overall update besides incremental updates in case of changes in historical status fields or incomplete data synchronization of ODS tables.

### 3. **Incremental Update Strategies**

(1) Set `where >= "activity time -1 day or -1 hour"`  instead of `where >= "activity time`

The reason for doing so is to prevent data drift caused by the time gap of scheduling scripts. Let's say, with the execution interval set to 10 min, suppose that the script is executed at 23:58:00 and a new piece of data arrives at 23:59:00, if we set `where >= "activity time`, that piece of data of the day will be missed.

(2) Fetch the ID of the largest primary key of the table before every script execution, store the ID in the auxiliary table, and set `where >= "ID in auxiliary table"`

This is to avoid data duplication. Data duplication might happen if you use the Unique Key model of Apache Doris and designate a set of primary keys, because if there are any changes in the primary keys in the source table, the changes will be recorded and the relevant data will be loaded. This method can fix that, but it is only applicable when the source tables have auto-increment primary keys.

(3) Partition the tables

As for time-based auto-increment data such as log tables, there might be less changes in historical data and status, but the data volume is large, so there could be huge computing pressure on overall updates and snapshot creation. Hence, it is better to partition such tables, so for each incremental update, we only need to replace one partition. (You might need to watch out for data drift, too.)

### 4. **Overall Update Strategies**

(1) Truncate Table

Clear out the table and then ingest all data from the source table into it. This is applicable for small tables and scenarios with no user activity in wee hours.

(2) `ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 `

This is an atomic operation and it is advisable for large tables. Every time before executing a script, we create a temporary table with the same schema, load all data into it, and replace the original table with it.

## Application

- **ETL job**: every minute
- **Configuration for first-time deployment**: 8 nodes, 2 frontends, 8 backends, hybrid deployment
- **Node configuration**: 32C * 60GB * 2TB SSD

This is our configuration for TBs of legacy data and GBs of incremental data. You can use it as a reference and scale your cluster on this basis. Deployment of Apache Doris is simple. You don't need other components.

1. To integrate offline data and log data, we use DataX, which supports CSV format and readers of many relational databases, and Apache Doris provides a DataX-Doris-Writer.

![DataX-Doris-Writer](/images/Midland_3.png)

2. We use Flink CDC to synchronize data from source tables. Then we aggregate the real-time metrics utilizing the Materialized View or the Aggregate Model of Apache Doris. Since we only have to process part of the metrics in a real-time manner and we don't want to generate too many database connections, we use one Flink job to maintain multiple CDC source tables. This is realized by the multi-source merging and full database sync features of Dinky, or you can implement a Flink DataStream multi-source merging task yourself. It is noteworthy that Flink CDC and Apache Doris support Schema Change.

```SQL
EXECUTE CDCSOURCE demo_doris WITH (
  'connector' = 'mysql-cdc',
  'hostname' = '127.0.0.1',
  'port' = '3306',
  'username' = 'root',
  'password' = '123456',
  'checkpoint' = '10000',
  'scan.startup.mode' = 'initial',
  'parallelism' = '1',
  'table-name' = 'ods.ods_*,ods.ods_*',
  'sink.connector' = 'doris',
  'sink.fenodes' = '127.0.0.1:8030',
  'sink.username' = 'root',
  'sink.password' = '123456',
  'sink.doris.batch.size' = '1000',
  'sink.sink.max-retries' = '1',
  'sink.sink.batch.interval' = '60000',
  'sink.sink.db' = 'test',
  'sink.sink.properties.format' ='json',
  'sink.sink.properties.read_json_by_line' ='true',
  'sink.table.identifier' = '${schemaName}.${tableName}',
  'sink.sink.label-prefix' = '${schemaName}_${tableName}_1'
);
```

3. We use SQL scripts or "Shell + SQL" scripts, and we perform script lifecycle management. At the ODS layer, we write a general DataX job file and pass parameters for each source table ingestion, instead of writing a DataX job for each source table. In this way, we make things much easier to maintain. We manage the ETL scripts of Apache Doris on DolphinScheduler, where we also conduct version control. In case of any errors in the production environment, we can always rollback.

![SQL-script](/images/Midland_4.png)

4. After ingesting data with ETL scripts, we create a page in our reporting tool. We assign different privileges to different accounts using SQL, including the privilege of modifying rows, fields, and global dictionary. Apache Doris supports privilege control over accounts, which works the same as that in MySQL. 

![privilege-control-over-accounts](/images/Midland_5.png)

We also use Apache Doris data backup for disaster recovery, Apache Doris audit logs to monitor SQL execution efficiency, Grafana+Loki for cluster metric alerts, and Supervisor to monitor the daemon processes of node components.

## Optimization

### 1. Data Ingestion

We use DataX to Stream Load offline data. It allows us to adjust the size of each batch. The Stream Load method returns results synchronously, which meets the needs of our architecture. If we execute asynchronous data import using DolphinScheduler, the system might assume that the script has been executed, and that can cause a messup. If you use a different method, we recommend that you execute `show load` in the shell script, and check the regex filtering status to see if the ingestion succeeds.

### 2. Data Model

We adopt the Unique Key model of Apache Doris for most of our tables. The Unique Key model ensures idempotence of data scripts and effectively avoids upstream data duplication. 

### 3. Reading External Data

We use the Multi-Catalog feature of Apache Doris to connect to external data sources. It allows us to create mappings of external data at the Catalog level.

### 4. Query Optimization

We suggest that you put the most frequently used fields of non-character types (such as int and where clauses) in the first 36 bytes, so you can filter these fields within milliseconds in point queries.

### 5. Data Dictionary

For us, it is important to create a data dictionary because it largely reduces personnel communication costs, which can be a headache when you have a big team. We use the `information_schema` in Apache Doris to generate a data dictionary. With it, we can quickly grasp the whole picture of the tables and fields and thus increase development efficiency.

## Performance

**Offline data ingestion time**: Within minutes

**Query latency**: For tables containing over 100 million rows, Apache Doris responds to ad-hoc queries within one second, and complicated queries in five seconds.

**Resource consumption**: It only takes up a small number of servers to build this data warehouse. The 70% compression ratio of Apache Doris saves us lots of storage resources.

## **Experience and Conclusion**

Actually, before we evolved into our current data architecture, we tried Hive, Spark and Hadoop to build an offline data warehouse. It turned out that Hadoop was overkill for a traditional company like us since we didn't have too much data to process. It is important to find the component that suits you most.

![old-offline-data warehouse](/images/Midland_6.png)

(Our old off-line data warehouse)

On the other hand, to smoothen our  big data transition, we need to make our data platform as simple as possible in terms of usage and maintenance. That's why we landed on Apache Doris. It is compatible with MySQL protocol and provides a rich collection of functions so we don't have to develop our own UDFs. Also, it is composed of only two types of processes: frontends and backends, so it is easy to scale and track.

Find Apache Doris developers on [Slack](https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw).
