---
{
    "title": "查询缓存",
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


## 概念介绍

SQL Cache 是 Doris 提供的一种查询优化机制，可以显著提升查询性能。它通过缓存查询结果来减少重复计算，适用于数据更新频率较低的场景。

SQL Cache 基于以下关键因素来存储和获取缓存：

1. SQL 文本

2. 视图定义

3. 表和分区的版本

4. 用户变量和结果值

5. 非确定函数和结果值

6. 行策略定义

7. 数据脱敏定义

以上因素的组合唯一确定一个缓存数据集。如果其中任何一个发生变化，例如 SQL 变化、查询字段或条件不同或者数据更新后版本变化，缓存将不会命中。

对于涉及多表 Join 的查询，如果其中一个表更新了，分区 ID 或版本号就会不同，导致缓存无法命中。

SQL Cache 非常适合 T+1 更新场景。数据在凌晨更新，第一次查询从 BE 获取结果并放入缓存，后续相同性质的查询则直接从缓存获取结果。实时更新数据也可以使用 SQL Cache，但可能会面临较低的缓存命中率。

目前，SQL Cache 支持 OlapTable 内部表和 Hive 外部表。

## 实现原理

### BE 实现原理

在大多数情况下，SQL Cache 的结果会通过一致性哈希方法选择一个 BE，并将其存放在该 BE 的内存中。这些结果以 HashMap 的结构进行存储。当读写 Cache 的请求到来时，系统会使用 SQL 字符串等元数据信息的摘要作为 Key，从 HashMap 中快速检索结果数据进行操作。

### FE 实现原理

当 FE 接收到查询请求时，它首先会在内存中利用 SQL 字符串进行查找，判断之前是否执行过相同的查询，并尝试获取该查询的元数据信息，这些信息包括查询所涉及表的版本以及分区的版本。

若这些元数据信息保持不变，则说明相应表的数据未发生变更，因此可以重复利用之前的 SQL Cache。在这种情况下，FE 能够跳过 SQL 解析优化流程，直接依据一致性哈希算法定位到对应的 BE，并尝试从中检索查询结果。

- 若目标 BE 中存有该查询结果的缓存，FE 便能迅速将结果返回给客户端

- 反之，若 BE 中未找到对应的结果缓存，FE 则需执行完整的 SQL 解析与优化流程，随后将查询计划传送至 BE 进行计算处理。

当 BE 将计算结果返回给 FE 后，FE 会 负责将这些结果存储至对应的 BE 中，并在其内存中记录此次查询的元数据信息。这样做是为了在后续接收到相同查询时，FE 能够直接从 BE 中获取结果，从而提高查询效率。

此外，如果 SQL 优化阶段判断出查询结果仅包含 0 行或 1 行数据，FE 会选择将这些结果保存在其内存中，以便更快速地响应未来可能的相同查询。

## 最佳实践

### 开启和关闭 SQL Cache

```sql
-- 在当前 Session 打开 SQL Cache, 默认是关闭状态
set enable_sql_cache=true;
-- 在当前 Session 关闭 SQL Cache
set enable_sql_cache=false;

-- 全局打开 SQL Cache, 默认是关闭状态
set global enable_sql_cache=true;
-- 全局关闭 SQL Cache
set global enable_sql_cache=false;
```

### 检查查询是否命中 SQL Cache

在 Doris 2.1.3 版本及其后续版本中，用户能够通过执行`explain plan`语句检查当前查询是否能够成功命中 SQL Cache。

如示例所示，当查询计划树中出现`LogicalSqlCache`或`PhysicalSqlCache`节点时，即表明查询已命中 SQL Cache。

```sql
> explain plan select * from t2;

+------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                            |
+------------------------------------------------------------------------------------------------------------+
| ========== PARSED PLAN (time: 28ms) ==========                                                             |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== ANALYZED PLAN  ==========                                                                       |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== REWRITTEN PLAN  ==========                                                                      |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== OPTIMIZED PLAN  ==========                                                                      |
| PhysicalSqlCache[3] ( queryId=711dea740e4746e6-8bc11afe08f6542c, backend=192.168.126.3:9051, rowCount=12 ) |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
+------------------------------------------------------------------------------------------------------------+
```

对于 Doris 2.1.3 之前的版本，用户则需要通过查看 Profile 信息来确认查询是否命中了 SQL Cache。在 Profile 信息中，若 `Is Cached:` 这一字段显示为 `Yes`，则代表该查询已成功命中 SQL Cache。

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

这两种方法均为用户提供了有效的手段来验证查询是否利用了 SQL Cache，从而帮助用户更好地评估查询性能并优化查询策略。

### 统计缓存的指标

**1. 在 FE 的 HTTP 接口** **`http://${FE_IP}:${FE_HTTP_PORT}/metrics`** **会返回两个相关指标：**

```Plain
# 代表已经把 1 个 SQL 写入到缓存中
doris_fe_cache_added{type="sql"} 1

# 代表命中了两次 SQL Cache
doris_fe_cache_hit{type="sql"} 2
```

:::caution 注意

以上指标统计的是命中次数，只增不减，当 FE 重启后从 0 开始统计。

:::

**2. 在 BE 的 HTTP 接口** **`http://${BE_IP}:${BE_HTTP_PORT}/metrics`** **会返回相关信息：**

```Plain
# 代表当前 BE 的内存中存在 1205 个 Cache
doris_be_query_cache_sql_total_count 1205

# 当前所有 Cache 占用 BE 内存 44k
doris_be_query_cache_memory_total_byte 44101
```

:::caution 注意

不同的 Cache 可能会存放到不同的 BE 中，因此需收集所有 BE 的 Metrics 才能得到完整信息。

:::

### FE 内存控制

在 FE 中，Cache 的元数据信息被设置为弱引用。当 FE 内存不足时，系统会自动释放最近最久未使用的 Cache 元数据。此外，用户还可以通过执行以下 SQL 语句，进一步限制 FE 内存的使用量。此配置实时生效，且每个 FE 都需要进行配置。若需持久化配置，则需将其保存在 fe.conf 文件中。

```sql
-- 最多存放 100 个 Cache 元数据，超过时自动释放最近最久未使用的元数据。默认值为 100。  
ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num'='100');  
  
-- 当 300 秒未访问该 Cache 元数据后，自动进行释放。默认值为 300。  
ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second'='300');
```

### BE 内存控制

在 be.conf 文件中进行以下配置更改，重启 BE 后生效：

```sql
-- 当 Cache 的内存空间超过 query_cache_max_size_mb + query_cache_elasticity_size_mb 时，  
-- 释放最近最久未使用的 Cache，直至占用内存低于 query_cache_max_size_mb。  
query_cache_max_size_mb = 256  
query_cache_elasticity_size_mb = 128
```

另外还可以在 FE 中配置，当结果行数或大小超过某个阈值时，不创建 SQL Cache：

```sql
-- 默认超过 3000 行结果时，不创建 SQL Cache。  
ADMIN SET FRONTEND CONFIG ('cache_result_max_row_count'='3000');  
  
-- 默认超过 30M 时，不创建 SQL Cache。  
ADMIN SET FRONTEND CONFIG ('cache_result_max_data_size'='31457280');
```

### 排查缓存失效原因

缓存失效原因一般包括以下几点：

1. 表/视图的结构发生了变化，例如执行了 `drop table`、`replace table`、`alter table` 或 `alter view` 等操作。

2. 表数据发生了变化，例如执行了 `insert`、`delete`、`update` 或 `truncate` 等操作。

3. 用户权限被移除，例如执行了 `revoke` 操作。

4. 使用了非确定函数，并且函数的评估值发生了变化，例如执行了 `select random()`。

5. 使用了变量，并且变量的值发生了变化，例如执行了 `select * from tbl where dt = @dt_var`。

6. Row Policy 或 Data Masking 发生了变化，例如设置了用户对某些表的部分数据不可见。

7. 结果行数超过了 FE 配置的 `cache_result_max_row_count`，默认值为 3000 行。

8. 结果大小超过了 FE 配置的 `cache_result_max_data_size`，默认值为 30MB。

## 使用限制

### 非确定函数

非确定函数是指其运算结果与输入参数之间无法形成固定关系的函数。

以常见函数 `select now()` 为例，它返回当前的日期与时间。由于该函数在不同时间执行时会返回不同的结果，因此其返回值是动态变化。`now` 函数返回的是秒级别的时间，所以在同一秒内可以复用之前的 SQL Cache；但下一秒之后，就需要重新创建 SQL Cache。

为了优化缓存利用率，建议将这种细粒度的时间转为粗粒度的时间，例如使用 `select * from tbl where dt=date(now())`。在这种情况下，同一天的查询都可以利用到 SQL Cache。

相比之下，`random()` 函数则很难利用到 Cache，因为它每次运算的结果都是不同的。因此，应尽量避免在查询中使用这类非确定函数。