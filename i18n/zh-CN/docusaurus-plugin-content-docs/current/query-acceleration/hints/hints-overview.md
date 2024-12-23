# Hint 概述

数据库 Hint 是一种查询优化技术，用于指导数据库查询优化器如何生成指定的计划。通过提供 Hint，用户可以对查询优化器的默认行为进行微调，以期望获得更好的性能或满足特定需求。

## Hint 分类

doris 目前支持的几种 hint 类型，包括 leading hint，ordered hint，distribute hint 以及 set var hint 等几种：

- Leading Hint：用于指定 join order 为 leading 中提供的 order 顺序；
- Ordered Hint：用于指定 join order 为原始文本序；
- Distribute Hint：用于指定 join 的数据分发方式为 shuffle 还是 broadcast；
- SetVar Hint：用于设置在单条 SQL 里面使用的 `sessionVariables` 仅在该条 SQL 的生命周期内生效。

## Hint 示例

假设有一个包含大量数据的表，而在某些特定情况下，你了解到在一个查询中，表的连接顺序可能会影响查询性能。此时，Leading Hint 允许你指定希望优化器遵循的表连接顺序。

以下面 SQL 查询为例，若执行效率不理想，我们希望调整 join 顺序，同时不改变原始 SQL，以免影响用户原始场景，并达到调优目的。

```sql
mysql> _explain_ shape _plan_ _select_ * _from_ t1 _join_ t2 _on_ t1.c1 = c2;
+-------------------------------------------+
| _Explain_ String                            |
+-------------------------------------------+
| PhysicalResultSink                        |
| --PhysicalDistribute                      |
| ----PhysicalProject                       |
| ------hashJoin[INNER_JOIN](t1.c1 = t2.c2) |
| --------PhysicalOlapScan[t2]              |
| --------PhysicalDistribute                |
| ----------PhysicalOlapScan[t1]            |
+-------------------------------------------+
7 _rows_ in _set_ (0.06 sec)
```

此时，我们可以使用 Leading Hint 来任意改变 t1 和 t2 的 Join 顺序。例如：

```sql
mysql> _explain_ shape _plan_ _select_ /*+ leading(t2 t1) */ * _from_ t1 _join_ t2 _on_ c1 = c2;
+-----------------------------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                                     |
+-----------------------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                                  |
| --PhysicalDistribute                                                                                |
| ----PhysicalProject                                                                                 |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() build RFs:RF0 c1->[c2] |
| --------PhysicalOlapScan[t2] apply RFs: RF0                                                         |
| --------PhysicalDistribute                                                                          |
| ----------PhysicalOlapScan[t1]                                                                      |
|                                                                                                     |
| Hint log:                                                                                           |
| Used: leading(t2 t1)                                                                                |
| UnUsed:                                                                                             |
| SyntaxError:                                                                                        |
+-----------------------------------------------------------------------------------------------------+
12 _rows_ in _set_ (0.06 sec)
```

在此示例中，使用了 `/*+ leading(t2 t1) */` 的 Leading Hint。Leading Hint 会告知优化器在执行计划中使用指定表（t2）作为驱动表，并将其置于（t1）之前。

## Hint Log

Hint Log 主要用于在执行 `EXPLAIN` 时显示提示是否生效。其显示位置通常位于 `EXPLAIN` 输出的最下方。

Hint Log 分为三个状态：

```sql
+---------------------------------+
| Hint log:                       |
| Used:                           |
| UnUsed:                         |
| SyntaxError:                    |
+---------------------------------+
```

- `Used`：表明该提示生效了。
- `UnUsed` 和 `SyntaxError`：都表明该提示未生效。 `SyntaxError` 表示提示语法使用错误或该语法不支持，同时会附加不支持的原因信息。

用户可以通过 Hint log 查看生效情况以及未生效原因，便于调整和验证。

## 总结

Hint 是手动管理执行计划的强大工具。当前 Doris 支持的 leading hint, ordered hint, distribute hint, set var hint 等，可以支撑用户手动管理 join order, shuffle 方式以及其他变量配置，给用户提供更方便有效的的运维能力。
