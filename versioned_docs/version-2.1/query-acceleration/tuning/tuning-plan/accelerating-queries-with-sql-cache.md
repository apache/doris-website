---
{
    "title": "Accelerating Queries with SQL Cache",
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

## Principle

For detailed implementation principles of SQL Cache, please refer to [SQL Cache](../../../query-acceleration/sql-cache-manual).

## Use Case

The following case illustrates how to enable and use SQL Cache in Doris:

1. Ensure that `cache_enable_sql_mode` in `fe.conf` is set to `true` (default is `true`):
   
    ```sql
    vim fe/conf/fe.conf
    cache_enable_sql_mode=true
    ```


2. Set the variable in the MySQL command line:
   
    ```sql
    MySQL [(none)]> set global enable_sql_cache=true;
    ```

    Note: `GLOBAL` indicates a global variable, not just for the current session.

3. In Doris versions 2.1.3 and above, you can control the number of cache key entries and the cleanup time with the following commands:
   
    ```sql
    MySQL [(none)]> ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num' = '100');
    MySQL [(none)]> ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second' = '300');
    ```


4. Execute the query

    Suppose we have a table named "sales" containing information on date, product, and sales amount. We need to query the total sales for each product over the past 30 days:

    ```sql
    SELECT product, SUM(amount) as total_sales
    FROM sales
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY product
    ORDER BY total_sales DESC
    LIMIT 10;
    ```

    When this query is executed for the first time, Doris retrieves the results from the BE and stores them in the cache. Subsequent executions of the same query will retrieve the results directly from the cache if the data has not been updated, significantly improving query speed.

5. Cache Conditions

    After the initial query, the query results will be cached if the following three conditions are met:

    - (Current time - last update time of the query partition) is greater than `cache_last_version_interval_second` in `fe.conf`.

    - The number of query result rows is less than `cache_result_max_row_count` in `fe.conf`.

    - The number of bytes in the query results is less than `cache_result_max_data_size` in `fe.conf`.

## Summary

SQL Cache is a query optimization mechanism provided by Doris that can significantly improve query performance. When using it, please note:

1. SQL Cache is not suitable for queries containing functions that generate random values (such as `random()`), as this can cause the query results to lose randomness.

2. Currently, it does not support using cached results of some metrics to satisfy queries for more metrics. For example, cached results for two metrics cannot be used for queries involving three metrics.

3. By reasonably using SQL Cache, you can significantly improve Doris's query performance, especially in scenarios with low data update frequency. In practical applications, cache parameters need to be adjusted based on specific data characteristics and query patterns to achieve optimal performance improvements.