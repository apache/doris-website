---
{
    "title": "Leading Hint 控制 Join 顺序：手工指定连接顺序优化查询",
    "sidebar_label": "Leading Hint 控制 Join 顺序",
    "language": "zh-CN",
    "description": "如何用 Leading Hint 在 Doris 中手工指定 Join 顺序？本文给出左右调换、左深树、右深树、Bushy 树及与 Distribute Hint 混用的实操示例。",
    "keywords": ["Doris Leading Hint", "Join 顺序", "左深树", "右深树", "Bushy 树", "Distribute Hint", "Nereids Planner", "查询调优"]
}
---

<!-- 知识类型：概念 + 操作 -->
<!-- 适用场景：复杂多表 Join 调优、CBO 选择不理想时的人工干预 -->

**Leading Hint** 是一种在 SQL 中手工指定多表 Join 连接顺序的提示语法，用于在特定场景下优化复杂查询的执行计划。详细语法可参考 [leading hint](../../../query-acceleration/hints/leading-hint.md) 文档。

### 阅读须知

- 已了解 Doris Nereids 优化器与 `EXPLAIN SHAPE PLAN` 输出
- 当前查询为多表 Join，且优化器自动选择的顺序未达预期
- 需要将 Join 形态控制为左深树 / 右深树 / Bushy 树
- 需要同时控制 Join 顺序与分发方式（Shuffle / Broadcast）

:::caution 注意
当前 Doris 已具备良好的开箱即用能力：在绝大多数场景下，优化器会自适应地优化各种场景下的性能，**无需用户手工使用 Hint 调优**。本章内容主要面向专业调优人员，业务人员了解即可。
:::

## 适用场景速查

<!-- 知识类型：参考 -->
<!-- 适用场景：快速判断该用哪种 Hint 形式 -->

| 场景 | 推荐 Hint 写法 | 产生的 Join 形态 |
| --- | --- | --- |
| 调换两表的左右连接顺序 | `leading(t2 t1)` | 左右调换 |
| 多表强制左深树 | `leading(t1 t2 t3)` | 左深树（Left-Deep） |
| 多表强制右深树 | `leading(t1 {t2 t3})` | 右深树（Right-Deep） |
| 多表强制 Bushy 树 | `leading({t1 t2} {t3 t4})` | Bushy 树 |
| 子查询 / 视图作为整体参与连接 | `leading(alias t1)` | 别名整体作为一个 Join 节点 |
| 同时控制顺序 + 分发方式 | `leading(a shuffle b broadcast c)` | 顺序 + 指定 Shuffle / Broadcast |

> 一句话定义：Leading Hint = 手工告诉优化器「先 Join 谁、再 Join 谁、按什么形态 Join」。

## 案例 1：调整左右表顺序

<!-- 知识类型：操作 -->
<!-- 适用场景：两表 Join 时希望调换左右表 -->

**目的**：将默认的 `t1 join t2` 顺序调整为 `t2 join t1`。

**原始计划**：

```sql
mysql> explain shape plan select from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                            |
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

**应用 Leading Hint**：

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                            |
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

**说明**：Hint log 中 `Used: leading(t2 t1)` 表示 Hint 已生效，左右表顺序已被调换。

## 案例 2：强制生成左深树

<!-- 知识类型：操作 -->
<!-- 适用场景：希望多表按线性顺序串联 Join -->

**目的**：让 `t1`、`t2`、`t3` 按 `((t1 ⨝ t2) ⨝ t3)` 的左深树形态执行。

```sql
mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+--------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                              |
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

**说明**：Hint log `Used: leading(t1 t2 t3)` 表示 Hint 已生效，计划呈左深树。

## 案例 3：强制生成右深树

<!-- 知识类型：操作 -->
<!-- 适用场景：希望右子树承担主要 Join 链 -->

**目的**：用花括号 `{}` 将右侧子 Join 包裹，构造 `(t1 ⨝ (t2 ⨝ t3))` 的右深树。

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+----------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                |
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

**说明**：Hint log `Used: leading(t1 { t2 t3 })` 表示 Hint 已生效，计划呈右深树。

## 案例 4：强制生成 Bushy 树

<!-- 知识类型：操作 -->
<!-- 适用场景：四表及以上、希望左右子树各自先 Join 再合并 -->

**目的**：用两组 `{}` 分别包裹左右子树，构造 `((t1 ⨝ t2) ⨝ (t3 ⨝ t4))` 的 Bushy 树。

```sql
mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3 join t4 on t3.c3 = t4.c4;
+-----------------------------------------------+
| _Explain_ String                              |
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

**说明**：Hint log `Used: leading({ t1 t2 } { t3 t4 })` 表示 Hint 已生效，计划呈 Bushy 树。

## 案例 5：View / 子查询作为整体参与连接

<!-- 知识类型：操作 -->
<!-- 适用场景：子查询或视图存在别名，需作为一个 Join 节点参与排序 -->

**目的**：让子查询别名 `alias` 与外层表 `t1` 按指定顺序连接。

```sql
mysql>  explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
+--------------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                    |
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

**说明**：Hint log `Used: leading(alias t1)` 表示 Hint 已生效，子查询 `alias` 被视作一个整体节点。

## 案例 6：Distribute Hint 与 Leading Hint 混用

<!-- 知识类型：操作 -->
<!-- 适用场景：复杂多表查询，需同时控制连接顺序与分发方式 -->

**目的**：在指定 Join 顺序的同时，逐对指定 `shuffle` 或 `broadcast` 分发方式。

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

**关键字含义**：

| 关键字 | 作用 |
| --- | --- |
| `leading(...)` | 控制总体的表之间相对 Join 顺序与形态 |
| `shuffle` | 指定该 Join 使用 Shuffle 分发 |
| `broadcast` | 指定该 Join 使用 Broadcast 分发 |
| `{ ... }` | 将多个表打包为一个子树，决定 Join 形态 |

**说明**：通过两种 Hint 结合使用，可同时灵活控制连接顺序与连接方式，便于人工指定期望的执行计划。

:::caution 使用建议
- 使用 `EXPLAIN` 仔细分析执行计划，确认 Leading Hint 达到预期效果。
- Doris 版本升级或业务数据变更后，应重新评估 Leading Hint 的效果，及时记录与调整。
:::

## 常见问题

<!-- 知识类型：故障排查 -->
<!-- 适用场景：Hint 不生效或行为不符合预期 -->

### Q1：Hint 没生效，Hint log 中 `UnUsed` 或 `SyntaxError` 有内容？

- **常见原因**：Hint 中表名 / 别名拼写错误、Hint 中的表与 SQL 中的表数量不一致、括号不匹配。
- **排查方式**：查看 `EXPLAIN SHAPE PLAN` 输出末尾的 `Hint log` 段，定位 `UnUsed` 或 `SyntaxError` 行的具体提示。

### Q2：Leading Hint 与 Distribute Hint 的关系？

- `leading` 决定**先 Join 谁、形态如何**；`shuffle` / `broadcast` 决定**每一对 Join 的数据分发方式**。
- 两者可独立使用，也可像[案例 6](#案例-6distribute-hint-与-leading-hint-混用) 一样混用。

### Q3：为什么子查询无法被拆分进 Leading Hint？

- 子查询 / 视图通过别名作为一个**整体节点**参与 `leading` 排序，参考[案例 5](#案例-5view--子查询作为整体参与连接)。
- 如需对子查询内部表也指定顺序，可在子查询内部再写一组 `leading` Hint。

### Q4：什么时候不该用 Leading Hint？

- 优化器自动选择的计划已最优；
- 业务数据频繁变化、统计信息不稳定时，固定 Hint 反而可能劣化性能。

## 总结

<!-- 知识类型：概念 -->
<!-- 适用场景：决定是否采用 Leading Hint -->

- **Leading Hint** 用于手工控制 Join 顺序与形态（左深树 / 右深树 / Bushy 树）。
- **可与 Shuffle / Broadcast Hint 结合**，同时控制顺序与分发方式。
- **谨慎使用**：在充分理解查询特性与数据分布的基础上使用，并随版本与数据变化定期复核。
