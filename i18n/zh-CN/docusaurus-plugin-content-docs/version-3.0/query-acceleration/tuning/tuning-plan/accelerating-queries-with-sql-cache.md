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

## 工作原理

关于 SQL Cache 详细实现原理，请参考 [查询缓存（SQL Cache）](../../../query-acceleration/sql-cache-manual)

## 调优案例

下面通过案例说明如何在 Doris 中启用和使用 SQL Cache：

1. 确保 `fe.conf` 中的 `cache_enable_sql_mode` 设置为 `true`（默认为 `true`）:

    ```sql
    vim fe/conf/fe.conf
    cache_enable_sql_mode=true
    ```

2. 在 MySQL 命令行中设置变量：

    ```sql
    MySQL [(none)]> set global enable_sql_cache=true;
    ```

    注意：`GLOBAL` 表示全局变量，不仅仅指当前会话。

3. 在 Doris 2.1.3 及以上版本中，可以通过以下命令控制缓存键信息的数量和清除时间：

    ```sql
    MySQL [(none)]> ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num' = '100');
    MySQL [(none)]> ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second' = '300');
    ```

4. 执行查询：

    假设我们有一个名为 "sales" 的表，包含日期、产品和销售额信息，需要查询过去 30 天每个产品的总销售额：

    ```sql
    SELECT product, SUM(amount) as total_sales
    FROM sales
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY product
    ORDER BY total_sales DESC
    LIMIT 10;
    ```

    第一次执行这个查询时，Doris 会从 BE 获取结果并将其存入缓存。之后再次执行相同的查询时，如果数据没有更新，结果将直接从缓存中获取，从而大大提高查询速度。

5. 缓存条件

    在首次查询后，如果满足以下三个条件，查询结果将被缓存：

    - (当前时间 - 查询分区的最后更新时间) 大于 `fe.conf` 中的 `cache_last_version_interval_second`。
    
    - 查询结果行数小于 `fe.conf` 中的 `cache_result_max_row_count`。
    
    - 查询结果字节数小于 `fe.conf` 中的 `cache_result_max_data_size`。

## 总结

SQL Cache 是 Doris 提供的一种查询优化机制，可以显著提升查询性能。在使用的时候需要注意：

1. SQL Cache 不适用于包含生成随机值的函数 (如 `random()`) 的查询，因为这会导致查询结果失去随机性。

2. 目前不支持使用部分指标的缓存结果来满足查询更多指标的需求。例如，之前查询了 2 个指标的缓存不能用于查询 3 个指标的情况。

3. 通过合理使用 SQL Cache，可以显著提升 Doris 的查询性能，特别是在数据更新频率较低的场景中。在实际应用中，需要根据具体的数据特征和查询模式来调整缓存参数，以获得最佳的性能提升。