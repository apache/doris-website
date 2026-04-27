---
{
    "title": "Distribute Hint",
    "language": "zh-CN",
    "description": "Distribute hint 用来控制 join 的 shuffle 方式。"
}
---

## 概述

Distribute hint 用来控制 join 的 shuffle 方式。

## 语法

- 支持指定右表的 Distribute Type，分为 `[shuffle]` 和 `[broadcast]` 两种，需写在 Join 右表前面。
- 支持任意个 Distribute Hint。
- 当遇到无法正确生成计划的 Distribute Hint 时，系统不会显示错误，会按最大努力原则生效，最终以 EXPLAIN 显示的 Distribute 方式为准。

## 案例

**与 Ordered Hint 混用**

把 Join 顺序固定为文本序，然后再指定相应的 Join 预期使用的 Distribute 方式。例如：

使用前：

```sql
mysql> explain shape plan select count(*) from t1 join t2 on t1.c1 = t2.c2;
  +----------------------------------------------------------------------------------+
  | Explain String(Nereids Planner)                                                  |
  +----------------------------------------------------------------------------------+
  | PhysicalResultSink                                                               |
  | --hashAgg[GLOBAL]                                                                |
  | ----PhysicalDistribute[DistributionSpecGather]                                   |
  | ------hashAgg[LOCAL]                                                             |
  | --------PhysicalProject                                                          |
  | ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
  | ------------PhysicalProject                                                      |
  | --------------PhysicalOlapScan[t1]                                               |
  | ------------PhysicalDistribute[DistributionSpecHash]                             |
  | --------------PhysicalProject                                                    |
  | ----------------PhysicalOlapScan[t2]                                             |
  +----------------------------------------------------------------------------------+
```

使用后：

```sql
mysql> explain shape plan select /*+ ordered */ count(*) from t2 join[broadcast] t1 on t1.c1 = t2.c2;
+----------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                  |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg[GLOBAL]                                                                |
| ----PhysicalDistribute[DistributionSpecGather]                                   |
| ------hashAgg[LOCAL]                                                             |
| --------PhysicalProject                                                          |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan[t2]                                               |
| ------------PhysicalDistribute[DistributionSpecReplicated]                       |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan[t1]                                             |
|                                                                                  |
| Hint log:                                                                        |
| Used: ORDERED                                                                    |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
```

Explain Shape Plan 里面会显示 Distribute 算子相关的信息。其中：

- `DistributionSpecReplicated` 表示该算子将对应的数据复制到所有 BE 节点；
- `DistributionSpecGather` 表示将数据 Gather 到 FE 节点；
- `DistributionSpecHash` 表示将数据按照特定的 hashKey 以及算法打散到不同的 BE 节点。

**与 Leading Hint 混用**

在编写 SQL 查询时，可以在使用 `LEADING` 提示的同时，为每个 `JOIN` 操作指定相应的 `DISTRIBUTE` 方式。以下是一个具体的例子，展示了如何在 SQL 查询中混合使用 `Distribute Hint` 和 `Leading Hint`。

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

## 总结

Distribute hint 是常用的控制 join shuffle 方式的 hint，用于手工指定 shuffle 或者 broadcast 分发方式。使用好 Distribute hint 能够满足现场针对 join shuffle 方式的调优需求，增加系统控制的灵活性。
