---
{
    "title": "Leading Hint",
    "language": "zh-CN",
    "description": "Leading Hint 是一种强大的查询优化技术，允许用户指导 Doris 优化器确定查询计划中的表连接顺序。正确使用 Leading Hint 可以显著提高复杂查询的性能。本文将详细介绍如何在 Doris 中使用 Leading Hint 来控制 join 顺序。"
}
---

Leading Hint 是一种强大的查询优化技术，允许用户指导 Doris 优化器确定查询计划中的表连接顺序。正确使用 Leading Hint 可以显著提高复杂查询的性能。本文将详细介绍如何在 Doris 中使用 Leading Hint 来控制 join 顺序。

## 常规 Leading Hint

### 语法

Leading Hint 允许指定希望优化器遵循的表连接顺序。在 Doris 里面，Leading Hint 的基本语法如下：

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```

其中需要注意的是：

- Leading Hint 由 `/*+` 和 `*/` 包围，并置于 SQL 语句中 SELECT 关键字之后。
- `tablespec` 是表名或表别名，至少需要指定两个表。
- 多个表之间用空格或','分隔。
- 可以使用大括号 `{}` 来显式地指定 Join Tree 的形状。

举例说明：

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

当 Leading Hint 不生效的时候会走正常的流程生成计划，EXPLAIN 会显示使用的 Hint 是否生效，主要分三种来显示：

| 状态            | 描述                                                                |
|---------------|-------------------------------------------------------------------|
| `Used`        | Leading Hint 正常生效                                                 |
| `Unused`      | 这里不支持的情况包含 Leading Hint 指定的 join order 与原 SQL 不等价或本版本暂不支持特性（详见限制） |
| `SyntaxError` | 指 Leading Hint 语法错误，如找不到对应的表等                                     |


1. Leading Hint 语法默认构造出左深树：
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

2. 同时允许使用大括号指定 Join 树形状：
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

3. 当有 View 作为别名参与 JoinReorder 的时候可以指定对应的 View 作为 Leading Hint 的参数。例：
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

### 案例

#### 基础场景

1. 建表语句如下：
    
    ```sql
    CREATE DATABASE testleading;
    USE testleading;
    
    create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
    create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
    create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
    create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
    ```

2. 原始 plan：
    
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

3. 当我们需要交换 t1 和 t2 的 join 顺序时，只需在前面加上 `leading(t2 t1)` 即可。在执行 `explain` 时，会显示是否使用了这个 hint。如下 Leading plan：`Used` 表示 Hint 正常生效
    
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

4. 如果 Leading Hint 存在语法错误，`explain` 时会在 `SyntaxError` 里显示相应信息，但计划仍能照常生成，只是不会使用 Leading 而已。例如：
    
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

#### 扩展场景

1. 左深树
    
    上文我们提及，Doris 在查询语句不使用任何括号的情况下，Leading 会默认生成左深树。
    
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

2. 右深树
    
    当需要将计划的形状做成右深树、Bushy 树或者 zig-zag 树时，只需加上大括号来限制 plan 的形状即可，无需像 Oracle 使用 swap 从左深树一步步调整。
    
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

3. Bushy 树
    
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

4. zig-zag 树

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

5. Non-inner Join
    
    当遇到非 inner-join（如 Outer Join 或 Semi/Anti Join）时，Leading Hint 会根据原始 SQL 语义自动推导各个 Join 的方式。若 Leading Hint 与原始 SQL 语义不同或无法生成，则会将其放入 `UnUsed` 中，但这并不影响计划正常流程的生成。
    
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

6. View
    
    在涉及别名（Alias）的情况下，可以将别名作为一个完整独立的子树进行指定，并在这些子树内部根据文本序生成 Join 顺序
    
    ```sql
    mysql>  explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
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

Ordered hint 可以看做 leading hint 的一种特例，用于控制 join order 为文本序。

### 语法

Ordered Hint 的语法为 `/*+ ORDERED */`，放置在 `SELECT` 语句中的 `SELECT` 关键字之后，紧接着查询的其余部分。

### 案例

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

与 Leading Hint 的关系：

当 Ordered Hint 和 Leading Hint 同时使用时，Ordered Hint 将优先于 Leading Hint。这意味着，即使指定了 Leading Hint，如果同时存在 Ordered Hint，查询计划将按照 Ordered Hint 的规则来执行，而 Leading Hint 将被忽略。以下是一个示例，展示了当两者同时使用时的情况：

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

## 总结

Leading Hint 是一个强大的手工控制 join order 的特性，在生产业务调优中应用广泛。使用好 leading hint 能够满足现场针对 join order 的调优需求，增加系统控制的灵活性。Ordered hint 是一种特殊的 leading hint，用于固定当前业务的 join order 为文本序，使用时需要注意和其他 Hint 之间的优先级关系。
