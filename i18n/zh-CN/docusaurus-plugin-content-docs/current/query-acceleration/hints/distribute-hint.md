---
title: Distribute Hint 控制 Join Shuffle 方式
language: zh-CN
description: 如何用 Distribute Hint 强制指定 Join 的 shuffle 或 broadcast 分发方式，调优查询性能。
keywords:
    - Distribute Hint
    - Join Shuffle
    - Broadcast Join
    - Doris Hint
    - Join 调优
    - 分发方式
---

<!-- 知识类型: Feature 说明 / 操作步骤 -->
<!-- 适用场景: Join 性能调优 / 强制指定分发方式 -->

## 概述

Distribute Hint 用于控制 Join 操作中右表的数据分发（Shuffle）方式，是手动调优 Join 执行计划的常用手段。通过显式指定分发方式，可以在优化器自动选择不理想时，灵活地干预查询执行计划。

**核心能力：**

- 强制指定 Join 右表的分发方式为 `shuffle` 或 `broadcast`。
- 可与 Ordered Hint、Leading Hint 组合使用，实现更细粒度的 Join 调优。
- 当 Hint 无法生效时，系统按最大努力原则处理，不会报错。

## 快速导航

- [语法规则](#语法规则)
- [分发方式说明](#分发方式说明)
- [使用案例](#使用案例)
    - [与 Ordered Hint 混用](#与-ordered-hint-混用)
    - [与 Leading Hint 混用](#与-leading-hint-混用)
- [FAQ](#faq)

## 语法规则

| 规则项 | 说明 |
| --- | --- |
| 书写位置 | Distribute Hint 写在 Join 右表前面 |
| 可选类型 | `[shuffle]` 或 `[broadcast]` |
| 数量限制 | 支持任意个 Distribute Hint |
| 失败处理 | 无法生成对应计划时不报错，按最大努力原则生效，最终以 EXPLAIN 显示的分发方式为准 |

## 分发方式说明

EXPLAIN Shape Plan 中会显示 Distribute 算子的分发类型，含义如下：

| 分发类型 | 含义 |
| --- | --- |
| `DistributionSpecReplicated` | 将对应的数据复制到所有 BE 节点（Broadcast 分发） |
| `DistributionSpecGather` | 将数据汇聚（Gather）到 FE 节点 |
| `DistributionSpecHash` | 按特定的 hashKey 及算法将数据打散到不同的 BE 节点（Shuffle 分发） |

## 使用案例

### 与 Ordered Hint 混用

**场景**：先通过 Ordered Hint 把 Join 顺序固定为文本顺序，再用 Distribute Hint 指定每个 Join 期望的分发方式。

**使用前**（默认计划）：

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

**使用后**（指定 Broadcast 分发）：

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

可以看到 `t1` 的分发方式从 `DistributionSpecHash` 变为 `DistributionSpecReplicated`，即 Broadcast 分发生效。

### 与 Leading Hint 混用

**场景**：使用 `LEADING` 提示固定 Join 顺序的同时，为每个 `JOIN` 操作指定相应的 `DISTRIBUTE` 方式，实现完整的执行计划控制。

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

## FAQ

**Q1：Distribute Hint 写错或无法生成对应计划时会怎样？**

系统不会报错，会按最大努力原则尝试生效。最终是否生效，请以 `EXPLAIN` 输出中显示的 Distribute 算子类型为准。

**Q2：什么时候用 `shuffle`，什么时候用 `broadcast`？**

- `broadcast`：右表数据量较小，复制到所有 BE 节点的代价低于 Shuffle 时使用。
- `shuffle`：双表数据量较大，按 hashKey 重分布更高效时使用。

**Q3：可以一次指定多个 Join 的分发方式吗？**

可以。Distribute Hint 数量没有限制，可与 Ordered Hint、Leading Hint 组合，对每个 Join 单独指定分发方式。

## 总结

Distribute Hint 是控制 Join Shuffle 方式的常用 Hint，用于手工指定 `shuffle` 或 `broadcast` 分发方式。合理使用 Distribute Hint，可以满足现场针对 Join Shuffle 方式的调优需求，提升系统控制的灵活性。
