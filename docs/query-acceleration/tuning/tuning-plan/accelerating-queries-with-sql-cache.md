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

## Overview
For the detailed implementation principle of SQL Cache, please refer to the chapter [SQL Cache](../../../query-acceleration/sql-cache-manual).

## Case
For detailed cases, please refer to the chapter [SQL Cache](../../../query-acceleration/sql-cache-manual).

## Summary
SQL Cache is a query optimization mechanism provided by Doris, which can significantly improve query performance. When using it, the following points should be noted:

:::tip Note
- SQL Cache is not suitable for queries containing functions that generate random values (such as `random()`), as this will cause the query results to lose randomness.
- Currently, it does not support using the cached results of some metrics to meet the needs of querying more metrics. For example, the cache for previously queried two metrics cannot be used for the situation of querying three metrics.
- By reasonably using SQL Cache, the query performance of Doris can be significantly improved, especially in scenarios with a low data update frequency. In practical applications, cache parameters need to be adjusted according to specific data characteristics and query patterns to achieve the best performance improvement.
  ::: 