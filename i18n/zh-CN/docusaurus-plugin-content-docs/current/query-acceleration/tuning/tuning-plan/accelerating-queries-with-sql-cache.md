---
{
    "title": "使用 SQL Cache 加速查询",
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

## 概述

关于 SQL Cache 详细实现原理，请参考 [查询缓存（SQL Cache）](../../../query-acceleration/sql-cache-manual)章节

## 案例

以下案例说明如何在 Doris 中启用和使用 SQL 缓存：
1. 确保 fe.conf 中的 cache_enable_sql_mode 设置为 true（默认值为 true）：
  ```sql
  vim fe/conf/fe.conf
  cache_enable_sql_mode=true
  ```
2. 在 MySQL 命令行中设置变量：

  ```sql
  MySQL [(none)]> set global enable_sql_cache=true;
  ```
  注意：GLOBAL 表示全局变量，不仅仅针对当前会话。

3. 在 Doris 版本 2.1.3 及以上版本中，您可以通过以下命令控制缓存键条目的数量和清理时间：

  ```sql
  MySQL [(none)]> ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num' = '100');
  MySQL [(none)]> ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second' = '300');
  ```


4. 执行查询

  假设我们有一个名为 "sales" 的表，包含日期、产品和销售金额的信息。我们需要查询过去 30 天内每个产品的总销售额：

  ```sql
  SELECT product, SUM(amount) as total_sales
  FROM sales
  WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  GROUP BY product
  ORDER BY total_sales DESC
  LIMIT 10;
  ```
  当第一次执行此查询时，Doris 会从 BE（后端）中检索结果并将其存储在缓存中。如果数据未更新，后续执行相同的查询将直接从缓存中检索结果，从而显著提高查询速度。

5. 缓存条件

  初始查询后，如果满足以下三个条件，查询结果将被缓存：

  -（当前时间 - 查询分区的最后更新时间）大于 fe.conf 中的 cache_last_version_interval_second。
  - 查询结果行数小于 fe.conf 中的 cache_result_max_row_count。
  - 查询结果的字节数小于 fe.conf 中的 cache_result_max_data_size。

## 总结
  SQL 缓存是 Doris 提供的一种查询优化机制，可以显著提升查询性能。在使用过程中，请注意：

  1. SQL 缓存不适用于包含生成随机值函数的查询（例如 random()），因为这会导致查询结果失去随机性。

  2. 目前，它不支持使用部分指标的缓存结果来满足更多指标的查询。例如，两个指标的缓存结果无法用于涉及三个指标的查询。

  3. 通过合理使用 SQL 缓存，您可以显著提升 Doris 的查询性能，特别是在数据更新频率较低的场景中。在实际应用中，需要根据具体的数据特性和查询模式调整缓存参数，以实现最佳的性能提升。
