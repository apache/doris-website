# 使用 Hint 调整 Join Shuffle 方式

## 概述

Doris 支持使用 Hint 来调整 Join 操作中数据 Shuffle 的类型，从而优化查询性能。本节将详细介绍如何在 Doris 中利用 Hint 来指定 Join Shuffle 的类型。

目前，Doris 支持两种独立的 [DistributeHint](https://selectdb.feishu.cn/wiki/BpBxwpu07iL4jjkeai1cfs24nrn?open_in_browser=true)，`[shuffle] ` 和 `[broadcast]`，用来指定 Join 右表的 Distribute Type。Distribute Type 需置于 Join 右表之前，采用中括号 `[]` 的方式。同时，Doris 也可以通过 LeadingHint 配合 DistributeHint 的方式，指定 shuffle 方式（详见“使用 Leading Hint 控制 Join 顺序”章节相关介绍）。

示例如下：

```sql
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```

## 案例

接下来将通过同一个例子来展示 DistributeHint 的使用方法：

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

原始 SQL 的计划如下，可见 t1 连接 t2 使用了 hash distribute（"DistributionSpecHash"）的方式。

```sql
+----------------------------------------------------------------------------------+  
| Explain String (Nereids Planner)                                                 |  
+----------------------------------------------------------------------------------+  
| PhysicalResultSink                                                               |  
| --hashAgg [GLOBAL]                                                               |  
| ----PhysicalDistribute [DistributionSpecGather]                                  |  
| ------hashAgg [LOCAL]                                                            |  
| --------PhysicalProject                                                          |  
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|  
| ------------PhysicalProject                                                      |  
| --------------PhysicalOlapScan [t1]                                              |  
| ------------PhysicalDistribute [DistributionSpecHash]                            |  
| --------------PhysicalProject                                                    |  
| ----------------PhysicalOlapScan [t2]                                            |  
+----------------------------------------------------------------------------------+
```

加入[broadcast] hint 后：

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```

可见 t1 连接 t2 的分发方式改为了 broadcast（"DistributionSpecReplicated"）的方式。

```sql
+----------------------------------------------------------------------------------+  
| Explain String (Nereids Planner)                                                 |  
+----------------------------------------------------------------------------------+  
| PhysicalResultSink                                                               |  
| --hashAgg [GLOBAL]                                                               |  
| ----PhysicalDistribute [DistributionSpecGather]                                  |  
| ------hashAgg [LOCAL]                                                            |  
| --------PhysicalProject                                                          |  
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|  
| ------------PhysicalProject                                                      |  
| --------------PhysicalOlapScan [t1]                                              |  
| ------------PhysicalDistribute [DistributionSpecReplicated]                      |  
| --------------PhysicalProject                                                    |  
| ----------------PhysicalOlapScan [t2]                                            | 
+----------------------------------------------------------------------------------+
```

## 总结

通过合理使用 DistributeHint，可以优化 Join 操作的 Shuffle 方式，提升查询性能。在实践中，建议先通过 EXPLAIN 分析查询执行计划，再根据实际情况指定合适的 Shuffle 类型。
