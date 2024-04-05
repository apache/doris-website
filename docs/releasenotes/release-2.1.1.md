---
{
    "title": "Release 2.1.1",
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

Dear community members, Apache Doris 2.1.1 has been officially released on April 3, 2024, with several enhancements and bug fixes based on 2.1.0, enabling smoother user experience.

- **Quick Download:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)

## Behavior Changed

1. Change float type output format to improve float type serialization performance.

- https://github.com/apache/doris/pull/32049

2. Change system table value functions active_queries(), workload_groups() to system tables. 

- https://github.com/apache/doris/pull/32314

3. Disable show query/load profile stmt because there are not so many developers use it and the pipeline and pipelinex engine not support it. 

- https://github.com/apache/doris/pull/32467

4. Upgrade arrow flight version to 15.0.2 to fix some bugs, so that please use ADBC 15.0.2 version to access Doris. 

- https://github.com/apache/doris/pull/32827.



## Upgrade Problem

1. BE will core when rolling pgrade problem from 2.0.x to 2.1.x 

- https://github.com/apache/doris/pull/32672

- https://github.com/apache/doris/pull/32444

- https://github.com/apache/doris/pull/32162

2. JDBC Catalog will have query errors when rolling grade rom 2.0.x to 2.1.x. 

- https://github.com/apache/doris/pull/32618



## New Feature

1. Enable column auth by default.

- https://github.com/apache/doris/pull/32659


2. Get correct cores for pipeline and pipelinex engine when running within docker or k8s. 

- https://github.com/apache/doris/pull/32370

3. Support read parquet int96 type. 

- https://github.com/apache/doris/pull/32394

4. Enable proxy protocol to support IP transparency. Using this protocol, IP transparency for load balancing can be achieved, so that after load balancing, Doris can still obtain the client's real IP and implement permission control such as whitelisting. 

- https://github.com/apache/doris/pull/32338/files

5. Add workload group queue related columns for active_queries system table. Uses could use this system to monitor the workload queue usage. 

- https://github.com/apache/doris/pull/32259

6. Add new system table backend_active_tasks to monitor the realtime query statics on every BE. 

- https://github.com/apache/doris/pull/31945

7. Add ipv4 and ipv6 support for spark-doris connector. 

- https://github.com/apache/doris/pull/32240

8. Add inverted index support for CCR. 

- https://github.com/apache/doris/pull/32101

9. Support select experimental session variable. 

- https://github.com/apache/doris/pull/31837

10. Support materialized view with bitmap_union(bitmap_from_array()) case. 

- https://github.com/apache/doris/pull/31962

11. Support partition prune for *HIVE_DEFAULT_PARTITION*. 

- https://github.com/apache/doris/pull/31736

12. Support function in set variable statement. 

- https://github.com/apache/doris/pull/32492

13. Support arrow serialization for varint type. 

- https://github.com/apache/doris/pull/32809



## Optimization

1. Auto resume routine load when be restart or during upgrade. And keep the routine load stable. 

- https://github.com/apache/doris/pull/32239

2. Routine Load: optimize allocate task to be algorithm for load balance. 

- https://github.com/apache/doris/pull/32021

3. Spark Load: update spark version for spark load to resolve cve problem. 

- https://github.com/apache/doris/pull/30368

4. Skip cooldown if the tablet is dropped. 

- https://github.com/apache/doris/pull/32079

5. Support using workload group to manage routine load. 

- https://github.com/apache/doris/pull/31671

6. [MTMV ]Improve the performance for query rewritting by materialized view. 

- https://github.com/apache/doris/pull/31886

7. Reduce jvm heap memory consumed by profiles of BrokerLoadJob. 

- https://github.com/apache/doris/pull/31985
8. Imporve the high QPS query by speed up PartitionPrunner. 

- https://github.com/apache/doris/pull/31970

9. Reduce duplicated memory consumption for column name and column path for schema cache. 

- https://github.com/apache/doris/pull/31141

10. Support more join types for query rewriting by materialized view such as INNER JOIN, LEFT OUTER JOIN, RIGHT OUTER JOIN, FULL OUTER JOIN, LEFT SEMI JOIN, RIGHT SEMI JOIN, LEFT ANTI JOIN, RIGHT ANTI JOIN 

- https://github.com/apache/doris/pull/32909



## Bugfix


1. Do not push down topn-filter through right/full outer join if the first orderkey is nulls first. 

- https://github.com/apache/doris/pull/32633

2. Fix memory leak in Java UDF 

- https://github.com/apache/doris/pull/32630

3. If some odbc tables use the same resource, and restore not all odbc tables, it will not retain the resource.
and check some conf for backup/restore 

- https://github.com/apache/doris/pull/31989

4. Fold constant will core for variant type. 

- https://github.com/apache/doris/pull/32265

5. Routine load will pause when transaction fail in some cases. 

- https://github.com/apache/doris/pull/32638

6. the result of left semi join with empty right side should be false instead of null. 

- https://github.com/apache/doris/pull/32477

7. Fix core when build inverted index for a new column with no data. 

- https://github.com/apache/doris/pull/32669

8. Fix be core caused by null-safe-equal join. 

- https://github.com/apache/doris/pull/32623

9. Partial update: fix data correctness risk when load delete sign data into a table with sequence col. 

- https://github.com/apache/doris/pull/32574

10. Select outfile: Fix the column type mapping in the orc/parquet file format. 

- https://github.com/apache/doris/pull/32281

11. Fix BE core during restore stage. 

- https://github.com/apache/doris/pull/32489

12. Use array_agg func after other agg func like count, sum, may make be core. 

- https://github.com/apache/doris/pull/32387

13. Variant type should always nullable or there will some bugs. 

- https://github.com/apache/doris/pull/32248

14. Fix the bug of handling empty blocks in schema change. 

- https://github.com/apache/doris/pull/32396

15. Fix BE will core when use json_length() in some cases. 

- https://github.com/apache/doris/pull/32145

16. Fix error when query iceberg table using date cast predicate 

- https://github.com/apache/doris/pull/32194

17. Fix some bugs when build inverted index for variant type. 

- https://github.com/apache/doris/pull/31992

18. Wrong result of two or more map_agg functions in query. 

- https://github.com/apache/doris/pull/31928

19. Fix wrong result of money_format function. 

- https://github.com/apache/doris/pull/31883

20. Fix connection hang after too many connections. 

- https://github.com/apache/doris/pull/31594