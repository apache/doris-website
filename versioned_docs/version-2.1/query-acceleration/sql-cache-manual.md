---
{
    "title": "SQL Cache",
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

SQL Cache is a query optimization mechanism provided by Doris that can significantly enhance query performance. It reduces redundant computations by caching query results, making it suitable for scenarios where data update frequency is low.

SQL Cache stores and retrieves caches based on the following key factors:

1. SQL Text

2. View Definitions

3. Table and Partition Versions

4. User Variables and Result Values

5. Non-deterministic Functions and Result Values

6. Row Policy Definitions

7. Data Masking Definitions

The combination of these factors uniquely determines a cached dataset. If any of these factors change, such as variations in SQL, different query fields or conditions, or version changes after data updates, the cache will not be hit.

For queries involving multi-table Joins, if one of the tables is updated, the partition ID or version number will differ, resulting in a cache miss.

SQL Cache is highly suitable for T+1 update scenarios. Data is updated early in the morning, the first query fetches results from the Backend (BE) and stores them in the cache, and subsequent queries of the same nature retrieve results directly from the cache. Real-time data updates can also use SQL Cache, but may face a lower cache hit rate.

Currently, SQL Cache supports both internal OlapTables and external Hive tables.

## Principles

### BE Principle

In most cases, SQL Cache results are selected through a consistent hashing method to choose a BE and are stored in that BE's memory. These results are stored in a HashMap structure. When requests to read or write the cache arrive, the system uses a digest of metadata information, such as the SQL string, as a key to quickly retrieve and manipulate result data from the HashMap.

### FE Principle

When the Frontend (FE) receives a query request, it first searches in its memory using the SQL string to determine if the same query has been executed before and attempts to retrieve the metadata information for that query. This information includes the versions of the tables and partitions involved in the query.

If these metadata remain unchanged, it indicates that the data in the corresponding tables has not been modified, allowing the reuse of the previous SQL Cache. In this case, the FE can skip the SQL parsing and optimization process, directly locate the corresponding BE based on the consistent hashing algorithm, and attempt to retrieve the query results from it.

- If the target BE contains a cached result for the query, the FE can quickly return the results to the client.

- Conversely, if the corresponding result cache is not found in the BE, the FE needs to execute the complete SQL parsing and optimization process and then transmit the query plan to the BE for computation and processing.

When the BE returns the computation results to the FE, the FE is responsible for storing these results in the corresponding BE and recording the metadata information of this query in its memory. This is done so that when the same query is received subsequently, the FE can directly retrieve the results from the BE, thereby improving query efficiency.

Additionally, if the SQL optimization phase determines that the query results contain only 0 or 1 row of data, the FE will choose to store these results in its memory to respond more quickly to potential future identical queries.

## Best Practices

### Enabling and Disabling SQL Cache

```sql
-- Enable SQL Cache for the current session, default is disabled  
set enable_sql_cache=true;  
-- Disable SQL Cache for the current session  
set enable_sql_cache=false;  
  
-- Globally enable SQL Cache, default is disabled  
set global enable_sql_cache=true;  
-- Globally disable SQL Cache  
set global enable_sql_cache=false;
```

### Checking If a Query Hits SQL Cache

In Doris versions 2.1.3 and later, users can execute the `explain plan` statement to check if the current query successfully hits the SQL Cache.

As shown in the example, when the query plan tree contains `LogicalSqlCache` or `PhysicalSqlCache` nodes, it indicates that the query has hit the SQL Cache.

```sql
> explain plan select * from t2;  
  
+------------------------------------------------------------------------------------------------------------+  
| Explain String (Nereids Planner)                                                                           |  
+------------------------------------------------------------------------------------------------------------+  
| ========== PARSED PLAN (time: 28ms) ==========                                                             |  
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |  
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |  
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |  
|                                                                                                            |  
| ========== ANALYZED PLAN ==========                                                                        |  
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |  
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |  
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |  
|                                                                                                            |  
| ========== REWRITTEN PLAN ==========                                                                       |  
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |  
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |  
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |  
|                                                                                                            |  
| ========== OPTIMIZED PLAN ==========                                                                       |  
| PhysicalSqlCache[3] ( queryId=711dea740e4746e6-8bc11afe08f6542c, backend=192.168.126.3:9051, rowCount=12 ) |  
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |  
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |  
+------------------------------------------------------------------------------------------------------------+
```

For versions before Doris 2.1.3, users need to check the Profile information to confirm if the query hits the SQL Cache. In the Profile information, if the `Is Cached:` field displays `Yes`, it indicates that the query has successfully hit the SQL Cache.

```sql
Execution  Summary:
      -  Parse  SQL  Time:  18ms
      -  Nereids  Analysis  Time:  N/A
      -  Nereids  Rewrite  Time:  N/A
      -  Nereids  Optimize  Time:  N/A
      -  Nereids  Translate  Time:  N/A
      -  Workload  Group:  normal
      -  Analysis  Time:  N/A
      -  Wait  and  Fetch  Result  Time:  N/A
      -  Fetch  Result  Time:  0ms
      -  Write  Result  Time:  0ms
      -  Doris  Version:  915138e801
      -  Is  Nereids:  Yes
      -  Is  Cached:  Yes
      -  Total  Instances  Num:  0
      -  Instances  Num  Per  BE:  
      -  Parallel  Fragment  Exec  Instance  Num:  1
      -  Trace  ID:  
      -  Transaction  Commit  Time:  N/A
      -  Nereids  Distribute  Time:  N/A
```

Both methods provide effective means for users to verify whether queries utilize the SQL Cache, helping users better assess query performance and optimize query strategies.

### Statistics on Cache Metrics

**1. The HTTP interface on the FE `http://${FE_IP}:${FE_HTTP_PORT}/metrics` returns two relevant metrics:**

```Plain
# Represents that 1 SQL has been written to the cache  
doris_fe_cache_added{type="sql"} 1  
  
# Represents that the SQL Cache has been hit twice  
doris_fe_cache_hit{type="sql"} 2
```

:::caution Note

The above metrics count the number of hits and only increase. They reset to 0 after an FE restart.

:::

**2. The HTTP interface on the BE `http://${BE_IP}:${BE_HTTP_PORT}/metrics` returns relevant information:**

```Plain
# Represents that there are 1205 caches in the memory of the current BE  
doris_be_query_cache_sql_total_count 1205  
  
# The current total memory occupied by all caches in the BE is 44k  
doris_be_query_cache_memory_total_byte 44101
```

:::caution Note

Different caches may be stored in different BEs, so metrics from all BEs need to be collected for complete information.

:::

### FE Memory Control

In FE, the metadata information of Cache is set to weak references. When FE memory is insufficient, the system will automatically release the least recently used Cache metadata. Additionally, users can further limit FE memory usage by executing the following SQL statements. This configuration takes effect in real-time and needs to be set for each FE. For persistent configuration, it should be saved in the fe.conf file.

```sql
-- Store up to 100 Cache metadata items, automatically releasing the least recently used ones when exceeded. The default value is 100.  
ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num'='100');  
  
-- Automatically release Cache metadata after 300 seconds of inactivity. The default value is 300.  
ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second'='300');
```

### BE Memory Control

Modify the following configurations in the be.conf file, and the changes will take effect after restarting BE:

```sql
-- When the Cache memory exceeds query_cache_max_size_mb + query_cache_elasticity_size_mb,  
-- release the least recently used Cache until the memory usage is below query_cache_max_size_mb.  
query_cache_max_size_mb = 256  
query_cache_elasticity_size_mb = 128
```

Furthermore, configurations can be set in FE to avoid creating SQL Cache when the result row count or size exceeds certain thresholds:

```sql
-- By default, do not create SQL Cache for results exceeding 3000 rows.  
ADMIN SET FRONTEND CONFIG ('cache_result_max_row_count'='3000');  
  
-- By default, do not create SQL Cache for results exceeding 30MB.  
ADMIN SET FRONTEND CONFIG ('cache_result_max_data_size'='31457280');
```

### Troubleshooting Cache Invalidation

The reasons for cache invalidation typically include the following:

1. Changes in table/view structure, such as executing `drop table`, `replace table`, `alter table`, or `alter view`.

2. Changes in table data, such as executing `insert`, `delete`, `update`, or `truncate`.

3. Removal of user privileges, such as executing `revoke`.

4. Use of non-deterministic functions with changing evaluation values, such as executing `select random()`.

5. Use of variables with changing values, such as executing `select * from tbl where dt = @dt_var`.

6. Changes in Row Policy or Data Masking, such as setting certain table data to be invisible to users.

7. The result row count exceeds the FE-configured `cache_result_max_row_count`, with a default value of 3000 rows.

8. The result size exceeds the FE-configured `cache_result_max_data_size`, with a default value of 30MB.

## Usage Limitations

### Non-Deterministic Functions

Non-deterministic functions refer to those whose computation results do not form a fixed relationship with their input parameters.

Take the common function `select now()` as an example. It returns the current date and time. Since this function returns different results when executed at different times, its return value is dynamically changing. The `now` function returns time at the second level, so SQL Cache from the previous second can be reused within the same second; however, a new SQL Cache needs to be created for the next second.

To optimize cache utilization, it is recommended to convert such fine-grained time into coarse-grained time, such as using `select * from tbl where dt=date(now())`. In this case, queries within the same day can leverage the SQL Cache.

In contrast, the `random()` function is difficult to utilize Cache because its results vary each time it is executed. Therefore, the use of such non-deterministic functions in queries should be avoided as much as possible.