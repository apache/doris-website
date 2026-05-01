---
title: Distribute Hint for Controlling Join Shuffle Methods
language: en
description: How to use Distribute Hint to force the shuffle or broadcast distribution method of a Join, and tune query performance.
keywords:
    - Distribute Hint
    - Join Shuffle
    - Broadcast Join
    - Doris Hint
    - Join tuning
    - distribution method
---

<!-- Knowledge type: Feature description / Operation steps -->
<!-- Applicable scenarios: Join performance tuning / Forcing the distribution method -->

## Overview

Distribute Hint controls how the right-table data is distributed (shuffled) in a Join operation, and is a common way to manually tune the Join execution plan. By explicitly specifying the distribution method, you can flexibly intervene in the query execution plan when the optimizer's automatic choice is not ideal.

**Core capabilities:**

- Force the distribution method of the Join right table to be `shuffle` or `broadcast`.
- Combine with Ordered Hint and Leading Hint for more fine-grained Join tuning.
- When a Hint cannot take effect, the system handles it on a best-effort basis and does not raise an error.

## Quick Navigation

- [Syntax Rules](#syntax-rules)
- [Distribution Method Description](#distribution-method-description)
- [Use Cases](#use-cases)
    - [Combined with Ordered Hint](#combined-with-ordered-hint)
    - [Combined with Leading Hint](#combined-with-leading-hint)
- [FAQ](#faq)

## Syntax Rules

| Rule | Description |
| --- | --- |
| Position | Distribute Hint is written before the Join right table |
| Optional types | `[shuffle]` or `[broadcast]` |
| Quantity limit | Any number of Distribute Hints is supported |
| Failure handling | When the corresponding plan cannot be generated, no error is raised. The Hint takes effect on a best-effort basis, and the final distribution method is whatever is shown by EXPLAIN |

## Distribution Method Description

The EXPLAIN Shape Plan displays the distribution type of the Distribute operator. The meanings are as follows:

| Distribution Type | Meaning |
| --- | --- |
| `DistributionSpecReplicated` | Replicates the corresponding data to all BE nodes (Broadcast distribution) |
| `DistributionSpecGather` | Gathers the data to the FE node |
| `DistributionSpecHash` | Distributes the data to different BE nodes by a specific hashKey and algorithm (Shuffle distribution) |

## Use Cases

### Combined with Ordered Hint

**Scenario**: First use Ordered Hint to fix the Join order to the textual order, and then use Distribute Hint to specify the desired distribution method for each Join.

**Before** (default plan):

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

**After** (specifying Broadcast distribution):

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

The distribution method of `t1` changes from `DistributionSpecHash` to `DistributionSpecReplicated`, which means Broadcast distribution has taken effect.

### Combined with Leading Hint

**Scenario**: Use the `LEADING` hint to fix the Join order while specifying the corresponding `DISTRIBUTE` method for each `JOIN` operation, achieving full control over the execution plan.

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

**Q1: What happens if a Distribute Hint is written incorrectly or the corresponding plan cannot be generated?**

The system does not raise an error and tries to apply the Hint on a best-effort basis. Whether the Hint ultimately takes effect depends on the type of the Distribute operator shown in the `EXPLAIN` output.

**Q2: When should you use `shuffle`, and when should you use `broadcast`?**

- `broadcast`: Use this when the right-table data volume is small and the cost of replicating it to all BE nodes is lower than the cost of Shuffle.
- `shuffle`: Use this when both tables have a large data volume and redistributing by hashKey is more efficient.

**Q3: Can you specify the distribution method for multiple Joins at once?**

Yes. There is no limit on the number of Distribute Hints, and they can be combined with Ordered Hint and Leading Hint to specify the distribution method for each Join individually.

## Summary

Distribute Hint is a common Hint for controlling the Join Shuffle method, and is used to manually specify the `shuffle` or `broadcast` distribution method. Reasonable use of Distribute Hint can meet on-site tuning requirements for the Join Shuffle method and improve the flexibility of system control.
