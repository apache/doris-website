---
{
    "title": "Migrating Data from Other OLAP",
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

To migrate data from other OLAP systems to Doris, you have a variety of options:

- For systems like Hive/Iceberg/Hudi, you can leverage Multi-Catalog to map them as external tables and then use "Insert Into" to import the data into Doris.

- You can export data from the OLAP system into formats like CSV, and then import the data files into Doris.

- You can also leverage the connectors of the OLAP systems, use tools like Spark / Flink, and then call the corresponding Doris Connector to write data into Doris.

The following third-party migration tools are also available:

- [X2Doris](https://www.velodb.io/download/tools).

    X2Doris is a core tool specifically for migrating various offline data to Apache Doris. This tool integrates `automatic Doris table creation` and `data migration`. Currently, it supports the migration of data from Apache Doris/Hive/Kudu, and StarRocks databases to Doris. The entire process is visualized on a platform, making it very simple and easy to use, thereby lowering the threshold for synchronizing data to Doris.

:::info NOTE
All third-party tools are not maintained or endorsed by the Apache Doris, which is overseen by the Committers and the Doris PMC. Their use is entirely at your discretion, and the community is not responsible for verifying the licenses or validity of these tools.
:::

:::info NOTE
If you know of the third-party migration tool for Doris that should be added to this list, please let us know at dev@doris.apache.org
:::

## X2Doris

### Support multiple data sources

As a one-stop data migration tool, X2Doris supports Apache Hive, Apache Kudu, StarRocks, and Apache Doris itself as data source. What's more, there are more data sources such as Greenplum and Druid that are under development and will be released subsequently. Among them, the Hive version already supports Hive 1.x and 2.x, while Doris, StarRocks, Kudu, and other data sources also support multiple different versions.

With X2Doris, users can build a complete database migration link from other OLAP systems to Apache Doris, and can also achieve data backup and recovery between different Doris clusters.

![x2doris-Support multiple data sources](/images/x2doris.jpg)

### Auto table creation

One of the biggest challenges in data migration is how to create corresponding target tables in Apache Doris for the source tables that need to be migrated. In real business scenarios, there are often thousands of tables stored in Hive, and it would be extremely inefficient and impractical for users to manually create tables and convert corresponding DDL statements.

X2Doris has been adapted for this scenario. Taking Hive table migration as an example, when migrating Hive tables, X2Doris automatically creates Duplicate Key model tables (which can also be manually modified) in Apache Doris and reads the metadata information of Hive tables. It automatically identifies partition fields based on field names and types, and if partitions are detected, it prompts for partition mapping. Finally, it directly generates the corresponding Doris target table DDL.

When the upstream data source is Doris/StarRocks, X2Doris automatically parses the table model based on the source table information, maps the source table field types to the corresponding target field types, and identifies and processes upstream properties parameters, converting them into attribute parameters for the corresponding target table. In addition, X2Doris has also enhanced support for complex types, enabling data migration for Array, Map, and Bitmap types.

![Auto table creation](/images/auto-table-creation.jpeg)

### High speed & stability

For data writing, X2Doris has specifically optimized the reading process. By optimizing the data batching logic, it further reduces memory usage. Additionally, significant improvements and enhancements have been made to Stream Load write requests, optimizing memory usage and release, further enhancing the speed and stability of data migration.

Compared to other similar migration tools, X2Doris offers a performance advantage of approximately 2-10 times. For example, when using a single machine with 1G of memory, other tools take approximately 90 seconds to synchronize 50 million rows of data in full, while X2Doris completes the task in less than 50 seconds, achieving a nearly 100% performance improvement.

In a practical large-scale log data migration scenario, with individual data records averaging 1KB in size, a single table containing nearly 100 million records, and a total storage space of approximately 90 GB, X2Doris can complete the full table migration in just 2 minutes, with an average write speed of nearly 800 MB/s.

![High speed & stability](/images/high-speed-stability.jpeg)
