---
{
    "title": "使用 Leading Hint 控制 Join 顺序",
    "language": "zh-CN",
    "description": "Leading Hint 特性允许用户手工指定查询中的表的连接顺序，在特定场景优化复杂查询性能。本文将详细介绍如何在 Doris 中使用 Leading Hint 来控制 join 的顺序。详细使用说明，可参考leading hint文档。"
}
---

## 概述

Leading Hint 特性允许用户手工指定查询中的表的连接顺序，在特定场景优化复杂查询性能。本文将详细介绍如何在 Doris 中使用 Leading Hint 来控制 join 的顺序。详细使用说明，可参考[leading hint](../../../query-acceleration/hints/leading-hint.md)文档。

:::caution 注意
当前 Doris 已经具备良好的开箱即用的能力，也就意味着在绝大多数场景下，Doris 会自适应的优化各种场景下的性能，无需用户来手工控制 hint 来进行业务调优。本章介绍的内容主要面向专业调优人员，业务人员仅做简单了解即可。
:::

## 案例 1：调整左右表顺序

对于如下查询：

```sql
mysql> explain shape plan select from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                              |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t1]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t2]                                               |
+------------------------------------------------------------------------------+
```

可以使用 Leading Hint，强制指定 join order 为 t2 join t1，调整原始连接顺序。

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                              |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t2]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t1]                                               |
|                                                                              |
| Hint log:                                                                    |
| Used: leading(t2 t1)                                                         |
| UnUsed:                                                                      |
| SyntaxError:                                                                 |
+------------------------------------------------------------------------------+
```

Hint log 展示了应用成功的 hint: `Used: leading(t2 t1)`。

## 案例 2：强制生成左深树

```sql
mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+--------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalOlapScan[t1]                                                 |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalOlapScan[t2]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalOlapScan[t3]                                                 |
|                                                                                |
| Hint log:                                                                      |
| Used: leading(t1 t2 t3)                                                        |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

同样，Hint log 展示了应用成功的 hint: `Used: leading(t1 t2 t3)`。

## 案例 3：强制生成右深树

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+----------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                  |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --PhysicalDistribute[DistributionSpecGather]                                     |
| ----PhysicalProject                                                              |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
| --------PhysicalOlapScan[t1]                                                     |
| --------PhysicalDistribute[DistributionSpecHash]                                 |
| ----------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ------------PhysicalOlapScan[t2]                                                 |
| ------------PhysicalDistribute[DistributionSpecHash]                             |
| --------------PhysicalOlapScan[t3]                                               |
|                                                                                  |
| Hint log:                                                                        |
| Used: leading(t1 { t2 t3 })                                                      |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
```

同样，Hint log 展示了应用成功的 hint: `Used: leading(t1 { t2 t3 })`。

## 案例 4：强制生成 bushy 树

```sql
mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3 join t4 on t3.c3 = t4.c4;
+-----------------------------------------------+
| _Explain_ String                                |
+-----------------------------------------------+
| PhysicalResultSink                            |
| --PhysicalDistribute                          |
| ----PhysicalProject                           |
| ------hashJoin[INNER_JOIN](t2.c2 = t3.c3)     |
| --------hashJoin[INNER_JOIN](t1.c1 = t2.c2)   |
| ----------PhysicalOlapScan[t1]                |
| ----------PhysicalDistribute                  |
| ------------PhysicalOlapScan[t2]              |
| --------PhysicalDistribute                    |
| ----------hashJoin[INNER_JOIN](t3.c3 = t4.c4) |
| ------------PhysicalOlapScan[t3]              |
| ------------PhysicalDistribute                |
| --------------PhysicalOlapScan[t4]            |
|                                               |
| Used: leading({ t1 t2 } { t3 t4 })            |
| UnUsed:                                       |
| SyntaxError:                                  |
+-----------------------------------------------+
```

同样，Hint log 展示了应用成功的 hint: `Used: leading({ t1 t2 } { t3 t4 })`。

## 案例 5：view 作为整体参与连接

```sql
mysql>  explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
+--------------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                      |
+--------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                   |
| --hashAgg[GLOBAL]                                                                    |
| ----PhysicalDistribute[DistributionSpecGather]                                       |
| ------hashAgg[LOCAL]                                                                 |
| --------PhysicalProject                                                              |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = alias.c2)) otherCondition=()  |
| ------------PhysicalProject                                                          |
| --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ----------------PhysicalProject                                                      |
| ------------------PhysicalOlapScan[t2]                                               |
| ----------------PhysicalDistribute[DistributionSpecHash]                             |
| ------------------PhysicalProject                                                    |
| --------------------PhysicalOlapScan[t3]                                             |
| ------------PhysicalDistribute[DistributionSpecHash]                                 |
| --------------PhysicalProject                                                        |
| ----------------PhysicalOlapScan[t1]                                                 |
|                                                                                      |
| Hint log:                                                                            |
| Used: leading(alias t1)                                                              |
| UnUsed:                                                                              |
| SyntaxError:                                                                         |
+--------------------------------------------------------------------------------------+
```

同样，Hint log 展示了应用成功的 hint: `Used: leading(alias t1)`。

## 案例 6：DistributeHint 与 LeadingHint 混用

```sql
explain shape plan
    select 
        nation,
        o_year,
        sum(amount) as sum_profit
    from
        (
            select
                /*+ leading(orders shuffle {lineitem shuffle part} shuffle {supplier broadcast nation} shuffle partsupp) */
                n_name as nation,
                extract(year from o_orderdate) as o_year,
                l_extendedprice * (1 - l_discount) - ps_supplycost * l_quantity as amount
            from
                part,
                supplier,
                lineitem,
                partsupp,
                orders,
                nation
            where
                s_suppkey = l_suppkey
                and ps_suppkey = l_suppkey
                and ps_partkey = l_partkey
                and p_partkey = l_partkey
                and o_orderkey = l_orderkey
                and s_nationkey = n_nationkey
                and p_name like '%green%'
        ) as profit
    group by
        nation,
        o_year
    order by
        nation,
        o_year desc;
```

上述 `/*+ leading(orders shuffle {lineitem shuffle part} shuffle {supplier broadcast nation} shuffle partsupp) */` hint 指定方式，混用了 leading 和 distribute hint 两种格式。leading 用于控制总体的表之间的相对 join 顺序，而 `shuffle` 和 `broadcast` 分别用于指定特定 join 使用何种 shuffle 方式。通过两种结合使用，可以灵活的控制连接顺序和连接方式，便于手工控制用户期望的计划行为。

:::caution 使用建议
- 建议使用 EXPLAIN 来仔细分析执行计划，以确保 Leading Hint 能达到预期的效果。
- Doris 版本升级或者业务数据变更时，应重新评估 Leading Hint 的效果，做到及时记录和调整。
:::

## 总结

Leading Hint 是一种强大的可以手工控制连接顺序的功能，于此同时，也可以和 shuffle hint 结合使用，同时控制 join 分发方式，进而优化查询性能。注意这种高级特性，应当在充分理解查询特性及数据分布的基础上谨慎使用。
