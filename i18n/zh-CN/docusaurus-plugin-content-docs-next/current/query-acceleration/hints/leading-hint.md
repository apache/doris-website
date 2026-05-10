---
title: Leading Hint 控制 Join 顺序
language: zh-CN
description: 如何用 Leading Hint 在 Doris 中手动指定多表 Join 顺序，解决复杂查询调优问题。
keywords:
    - Doris Leading Hint
    - Join 顺序控制
    - Ordered Hint
    - 左深树 右深树 Bushy 树
    - Join Reorder 调优
    - SyntaxError UnUsed
---

<!-- 知识类型: 特性说明 / 操作步骤 -->
<!-- 适用场景: 复杂查询性能调优 / Join 顺序手动干预 -->

## 一句话定义

Leading Hint 是 Doris 中用于手动指定多表 Join 顺序的查询提示（Hint），通过在 `SELECT` 关键字后添加 `/*+ LEADING(...) */` 注释，引导优化器按照指定顺序生成 Join 计划，从而提升复杂查询性能。

## 适用场景速览

<!-- 知识类型: 场景导览 -->
<!-- 适用场景: 选择合适的 Hint 类型 -->

在以下场景中可考虑使用 Leading Hint 或 Ordered Hint：

- 优化器自动选择的 Join 顺序不理想，需要人工干预。
- 复杂多表 Join 中希望显式指定左深树、右深树、Bushy 树或 zig-zag 树的形状。
- View 或子查询作为别名参与 Join Reorder，需要把整个子树作为整体定位。
- 希望强制按 SQL 文本中的表书写顺序进行 Join（使用 Ordered Hint）。

## 使用前 Checklist

<!-- 知识类型: 操作清单 -->

在编写 Hint 前，请确认：

- [ ] SQL 中至少包含两个参与 Join 的表。
- [ ] Hint 中使用的表名/别名与 `FROM` 子句中的一致。
- [ ] 已通过 `EXPLAIN SHAPE PLAN` 查看原始 Plan 与目标 Plan 的差异。
- [ ] 评估目标 Join Order 与原 SQL 在语义上等价（尤其是 Outer Join / Semi / Anti Join 场景）。

## 快速导航

- [常规 Leading Hint](#常规-leading-hint)：基础语法、生效状态、典型用法。
- [典型场景示例](#典型场景示例)：基础用法 + 左深树 / 右深树 / Bushy 树 / zig-zag 树 / Non-inner Join / View。
- [Ordered Hint](#ordered-hint)：固定 Join 顺序为文本序的特例。
- [常见问题（FAQ）](#常见问题-faq)：Hint 不生效、与其他 Hint 优先级等。

## 常规 Leading Hint

<!-- 知识类型: 语法说明 -->

### 语法

Leading Hint 用于指定希望优化器遵循的表连接顺序。在 Doris 中，基本语法如下：

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```

语法要点：

- Leading Hint 由 `/*+` 和 `*/` 包围，并置于 SQL 语句中 `SELECT` 关键字之后。
- `tablespec` 是表名或表别名，至少需要指定两个表。
- 多个表之间用空格或 `,` 分隔。
- 可以使用大括号 `{}` 显式地指定 Join Tree 的形状。

最小示例：

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
+------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                              |
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

### Hint 生效状态

当 Leading Hint 不生效时，会走正常流程生成计划。`EXPLAIN` 会显示该 Hint 是否生效，主要分为三种状态：

| 状态          | 描述                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `Used`        | Leading Hint 正常生效。                                                                                         |
| `UnUsed`      | 这里不支持的情况包含 Leading Hint 指定的 Join Order 与原 SQL 不等价，或本版本暂不支持的特性（详见限制）。       |
| `SyntaxError` | Leading Hint 语法错误，例如找不到对应的表等。                                                                   |

### 核心规则

1. **默认构造左深树**：Leading Hint 在不使用任何括号的情况下，默认构造出左深树。

    ```sql
    mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on c1 = c2 join t3 on c2=c3;
    +--------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                |
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

2. **使用大括号指定 Join 树形状**：通过 `{}` 可以显式控制 Join Tree 的形状。

    ```sql
    mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on c1 = c2 join t3 on c2=c3;
    +----------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                  |
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

3. **支持 View / 别名作为参数**：当 View 作为别名参与 Join Reorder 时，可以指定对应的 View 作为 Leading Hint 的参数。

    ```sql
    mysql> explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
    +--------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                      |
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

## 典型场景示例

<!-- 知识类型: 操作示例 -->
<!-- 适用场景: 学习 Leading Hint 用法 / 复制示例验证 -->

### 准备：建表语句

以下示例均基于这一组测试表。

```sql
CREATE DATABASE testleading;
USE testleading;

create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
```

### 基础场景：交换两个表的 Join 顺序

1. 原始 Plan：

    ```sql
    mysql> explain shape plan select * from t1 join t2 on t1.c1 = c2;
    +-------------------------------------------+
    | Explain String                            |
    +-------------------------------------------+
    | PhysicalResultSink                        |
    | --PhysicalDistribute                      |
    | ----PhysicalProject                       |
    | ------hashJoin[INNER_JOIN](t1.c1 = t2.c2) |
    | --------PhysicalOlapScan[t2]              |
    | --------PhysicalDistribute                |
    | ----------PhysicalOlapScan[t1]            |
    +-------------------------------------------+
    ```

2. 当需要交换 t1 和 t2 的 Join 顺序时，只需在前面加上 `leading(t2 t1)` 即可。在执行 `EXPLAIN` 时，`Used` 表示该 Hint 正常生效。

    ```sql
    mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
    +------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                              |
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

3. 如果 Leading Hint 存在语法错误，`EXPLAIN` 时会在 `SyntaxError` 中显示相应信息，但计划仍能照常生成，只是不会使用 Leading Hint。

    ```sql
    mysql> explain shape plan select /*+ leading(t2 t3) */ * from t1 join t2 on t1.c1 = c2;
    +--------------------------------------------------------+
    | Explain String                                         |
    +--------------------------------------------------------+
    | PhysicalResultSink                                     |
    | --PhysicalDistribute                                   |
    | ----PhysicalProject                                    |
    | ------hashJoin[INNER_JOIN](t1.c1 = t2.c2)              |
    | --------PhysicalOlapScan[t1]                           |
    | --------PhysicalDistribute                             |
    | ----------PhysicalOlapScan[t2]                         |
    |                                                        |
    | Used:                                                  |
    | UnUsed:                                                |
    | SyntaxError: leading(t2 t3) Msg:can not find table: t3 |
    +--------------------------------------------------------+
    ```

### 扩展场景：构造不同形状的 Join 树

下表汇总了四种常见 Join 树形状的写法：

| 形状     | Leading 写法                | 说明                              |
| -------- | --------------------------- | --------------------------------- |
| 左深树   | `leading(t1 t2 t3)`         | 默认行为，无需大括号。            |
| 右深树   | `leading(t1 {t2 t3})`       | 用 `{}` 把右子树包起来。          |
| Bushy 树 | `leading({t1 t2} {t3 t4})`  | 左右子树都用 `{}` 包起来。        |
| zig-zag 树 | `leading(t1 {t2 t3} t4)`  | 中间嵌入子树形成 zig-zag。        |

#### 左深树

如前所述，在不使用任何括号的情况下，Leading Hint 默认生成左深树。

```sql
mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
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

#### 右深树

当需要将计划的形状做成右深树、Bushy 树或 zig-zag 树时，只需加上大括号来限制 Plan 的形状即可，无需像 Oracle 那样使用 swap 从左深树一步步调整。

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3;
+-----------------------------------------------+
| Explain String                                |
+-----------------------------------------------+
| PhysicalResultSink                            |
| --PhysicalDistribute                          |
| ----PhysicalProject                           |
| ------hashJoin[INNER_JOIN](t1.c1 = t2.c2)     |
| --------PhysicalOlapScan[t1]                  |
| --------PhysicalDistribute                    |
| ----------hashJoin[INNER_JOIN](t2.c2 = t3.c3) |
| ------------PhysicalOlapScan[t2]              |
| ------------PhysicalDistribute                |
| --------------PhysicalOlapScan[t3]            |
|                                               |
| Used: leading(t1 { t2 t3 })                   |
| UnUsed:                                       |
| SyntaxError:                                  |
+-----------------------------------------------+
```

#### Bushy 树

```sql
mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3 join t4 on c3 = c4;
+-----------------------------------------------+
| Explain String                                |
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

#### zig-zag 树

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3} t4) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3 join t4 on c3 = c4;
+--------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                      |
+--------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                   |
| --PhysicalDistribute[DistributionSpecGather]                                         |
| ----PhysicalProject                                                                  |
| ------hashJoin[INNER_JOIN] hashCondition=((t3.c3 = t4.c4)) otherCondition=()         |
| --------PhysicalDistribute[DistributionSpecHash]                                     |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
| ------------PhysicalOlapScan[t1]                                                     |
| ------------PhysicalDistribute[DistributionSpecHash]                                 |
| --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ----------------PhysicalOlapScan[t2]                                                 |
| ----------------PhysicalDistribute[DistributionSpecHash]                             |
| ------------------PhysicalOlapScan[t3]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                                     |
| ----------PhysicalOlapScan[t4]                                                       |
|                                                                                      |
| Hint log:                                                                            |
| Used: leading(t1 { t2 t3 } t4)                                                       |
| UnUsed:                                                                              |
| SyntaxError:                                                                         |
+--------------------------------------------------------------------------------------+
```

### Non-inner Join 场景

当遇到非 Inner Join（如 Outer Join 或 Semi/Anti Join）时，Leading Hint 会根据原始 SQL 语义自动推导各个 Join 的方式。若 Leading Hint 与原始 SQL 语义不同或无法生成，则会将其放入 `UnUsed` 中，但这并不影响计划正常流程的生成。

以下是一个不能交换的例子：

```sql
-------- test outer join which can not swap
-- t1 leftjoin (t2 join t3 on (P23)) on (P12) != (t1 leftjoin t2 on (P12)) join t3 on (P23)
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
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
| Used:                                                                          |
| UnUsed: leading(t1 { t2 t3 })                                                  |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

下面是一些可以交换的例子和不能交换的例子，读者可自行验证。

```sql
-------- test outer join which can swap
-- (t1 leftjoin t2  on (P12)) innerjoin t3 on (P13) = (t1 innerjoin t3 on (P13)) leftjoin t2  on (P12)
explain shape plan select * from t1 left join t2 on c1 = c2 join t3 on c1 = c3;
explain shape plan select /*+ leading(t1 t3 t2) */ * from t1 left join t2 on c1 = c2 join t3 on c1 = c3;

-- (t1 leftjoin t2  on (P12)) leftjoin t3 on (P13) = (t1 leftjoin t3 on (P13)) leftjoin t2  on (P12)
explain shape plan select * from t1 left join t2 on c1 = c2 left join t3 on c1 = c3;
explain shape plan select /*+ leading(t1 t3 t2) */ * from t1 left join t2 on c1 = c2 left join t3 on c1 = c3;

-- (t1 leftjoin t2  on (P12)) leftjoin t3 on (P23) = t1 leftjoin (t2  leftjoin t3 on (P23)) on (P12)
select /*+ leading(t2 t3 t1) SWAP_INPUT(t1) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;

-------- test outer join which can not swap
--  t1 leftjoin (t2  join t3 on (P23)) on (P12) != (t1 leftjoin t2  on (P12)) join t3 on (P23)
-- eliminated to inner join
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 join t3 on c2 = c3;
explain graph select /*+ leading(t1 t2 t3) */ * from t1 left join (select * from t2 join t3 on c2 = c3) on c1 = c2;

-- test semi join
explain shape plan select * from t1 where c1 in (select c2 from t2);
explain shape plan select /*+ leading(t2 t1) */ * from t1 where c1 in (select c2 from t2);

-- test anti join
explain shape plan select * from t1 where exists (select c2 from t2);
```

### View / 别名场景

在涉及别名（Alias）的情况下，可以将别名作为一个完整独立的子树进行指定，并在这些子树内部根据文本序生成 Join 顺序。

```sql
mysql> explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
+--------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                      |
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

## Ordered Hint

<!-- 知识类型: 特性说明 -->
<!-- 适用场景: 强制 Join 顺序为 SQL 文本序 -->

Ordered Hint 可以看作 Leading Hint 的一种特例，用于控制 Join Order 为 SQL 文本序。

### 语法

Ordered Hint 的语法为 `/*+ ORDERED */`，放置在 `SELECT` 语句中的 `SELECT` 关键字之后，紧接着查询的其余部分。

### 示例

以下是一个使用 Ordered Hint 的示例：

```sql
mysql> explain shape plan select /*+ ORDERED */ t1.c1 from t2 join t1 on t1.c1 = t2.c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t2]                                               |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalProject                                                    |
| --------------PhysicalOlapScan[t1]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t3]                                               |
|                                                                                |
| Hint log:                                                                      |
| Used: ORDERED                                                                  |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

### 与 Leading Hint 的优先级关系

当 Ordered Hint 和 Leading Hint 同时使用时，Ordered Hint 优先于 Leading Hint。这意味着即使指定了 Leading Hint，如果同时存在 Ordered Hint，查询计划将按照 Ordered Hint 的规则执行，而 Leading Hint 将被忽略。

以下示例展示了两者同时使用时的情况：

```sql
mysql> explain shape plan select /*+ ORDERED LEADING(t1 t2 t3) */ t1.c1 from t2 join t1 on t1.c1 = t2.c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t2]                                               |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalProject                                                    |
| --------------PhysicalOlapScan[t1]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t3]                                               |
|                                                                                |
| Hint log:                                                                      |
| Used: ORDERED                                                                  |
| UnUsed: leading(t1 t2 t3)                                                      |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

## Leading Hint vs Ordered Hint 对比

<!-- 知识类型: 对比表格 -->
<!-- 适用场景: 选择合适的 Hint -->

| 维度         | Leading Hint                              | Ordered Hint                                  |
| ------------ | ----------------------------------------- | --------------------------------------------- |
| 语法         | `/*+ LEADING(t1 t2 ...) */`               | `/*+ ORDERED */`                              |
| Join 顺序    | 按 Hint 中表的列举顺序                    | 按 SQL 文本中 `FROM` 子句中的表书写顺序       |
| 控制 Join 树形状 | 支持，通过 `{}` 显式指定                 | 不支持，固定为左深树                          |
| 灵活性       | 高，可指定任意形状的 Join 树              | 低，仅按文本序                                |
| 同时使用时   | 被放入 `UnUsed`                           | 优先生效                                      |

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: Hint 不生效 / 报错排查 -->

### Q1：为什么 `EXPLAIN` 中的 Leading Hint 出现在 `UnUsed` 而不是 `Used`？

通常有两类原因：

- Leading Hint 指定的 Join Order 与原 SQL 语义不等价（例如 Outer Join 不可交换的场景）。
- 当前版本暂不支持该特性。

此时 Doris 会回退到正常计划生成流程，查询仍可正常执行。

### Q2：`SyntaxError` 提示找不到表怎么办？

`SyntaxError` 表示 Hint 自身存在语法错误，例如 `leading(t2 t3)` 中的 `t3` 未出现在 SQL 的 `FROM` 子句中。请检查 Hint 中的表名或别名是否与 SQL 中实际使用的一致。

### Q3：Ordered Hint 与 Leading Hint 同时使用时哪个生效？

Ordered Hint 优先级更高。当两者同时出现时，按 Ordered Hint 执行（Join 顺序为 SQL 文本序），Leading Hint 会被放入 `UnUsed`。

### Q4：默认生成什么形状的 Join 树？如何调整？

不使用大括号时默认生成左深树。需要右深树、Bushy 树或 zig-zag 树时，使用大括号 `{}` 显式指定形状即可，无需像 Oracle 那样从左深树逐步 swap。

### Q5：Hint 中的表名需要写全限定名吗？

不需要。Hint 中的表名/别名只需与当前查询 `FROM` 子句中使用的名称保持一致即可，不要求带库名前缀。

## 总结

Leading Hint 是一个强大的手工控制 Join Order 的特性，在生产业务调优中应用广泛。合理使用 Leading Hint 能够满足现场针对 Join Order 的调优需求，提升系统控制的灵活性。Ordered Hint 是一种特殊的 Leading Hint，用于将当前业务的 Join Order 固定为文本序，使用时需要注意它与其他 Hint 之间的优先级关系。
