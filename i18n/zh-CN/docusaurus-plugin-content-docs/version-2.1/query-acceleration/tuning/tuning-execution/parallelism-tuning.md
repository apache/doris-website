---
{
    "title": "并行度调优",
    "language": "zh-CN",
    "description": "Doris 的查询是一个 MPP 的执行框架，每一条查询都会在多个 BE 上并行执行；同时，在单个 BE 内部也会采用多线程并行的方式来加速查询的执行效率，目前所有的语句（包括 Query，DML，DDL）均支持并行执行。"
}
---

## 概述

Doris 的查询是一个 MPP 的执行框架，每一条查询都会在多个 BE 上并行执行；同时，在单个 BE 内部也会采用多线程并行的方式来加速查询的执行效率，目前所有的语句（包括 Query，DML，DDL）均支持并行执行。

单个 BE 内并行度的控制参数是：parallel_pipeline_task_num，是指单个 Fragment 在执行时所使用的工作任务数。在实际生产场景会遇到并行度设置不合理，引起的性能问题。在以下的案例中，列举了调整并行度优化的案例。

## 并行度调优的原则

parallel_pipeline_task_num 设定目的是为了充分利用多核资源，降低查询的延迟；但是，为了多核并行执行，通常会引入一些数据 Shuffle 算子，以及多线程之间同步的逻辑，这也会带来一些不必要的资源浪费。

Doris 中默认值为 0，即 BE 的 CPU 核数目的一半，这个值考虑了单查询和并发的资源利用的情况，通常不需要用户介入调整。当存在性能瓶颈时可以参考下面示例进行必要的调整。Doris 在持续完善自适应的策略，通常建议在特定场景或 SQL 级别进行必要的调整。

假设 BE 的 CPU 核数为 16：

1. 对于单表的简单操作（如单表点查、where 扫描获取少量数据，limit 少量数据，命中物化视图) **并行度可设置为 1**

  说明：单表的简单操作，只有一个 Fragment，查询的瓶颈通常在数据扫描处理上，数据扫描线程和查询执行的线程是分开的，数据扫描线程会自适应的做并行的扫描，这里的瓶颈不是查询线程，并行度可以直接设置为 1。

2. 对于两表 `JOIN` 的查询/聚合查询，如果数据量很大，确认是 CPU 瓶颈型查询，**并行度可设置为 16**。

  说明：对于两表 `JOIN`/聚合查询，这类数据计算密集型的查询，如果观察 CPU 没有打满，可以考虑在默认值的基础上，继续调大并行度，利用 Pipeline 执行引擎的并行能力，充分利用 CPU 资源参与计算。并不能保证每个 PipelineTask 都能将分配给它的 CPU 资源使用到极限。因此，可以适当调整并行度，比如设为 16，以更充分地利用 CPU。然而，不应无限制地增加并行度，设置为 48 根本不会带来实质性的收益，反而会增加线程调度开销和框架调度开销。

3. 对于压力测试场景，压测的多个查询的任务本身就能够充分利用 CPU，可以考虑**并行度设置为 1**。

  说明：对于压力测试场景，压测的查询的任务足够多。过大的并行度同样带来了线程调度开销和框架调度开销，这里需要设置为 1 是比较合理的。

4. 复杂查询的情况要根据 Profile 和机器负载，灵活调整，这里建议使用默认值，如果不合适可以尝试 4-2-1 的阶梯方式调整，观察查询表现和机器负载。

## 查询并行度调优

Doris 可以手动指定查询的并行度，以调整查询执行时并行执行的效率。

### SQL 级别调整

通过 SQL HINT 来指定单个 SQL 的并行度，这样可以灵活控制不同 SQL 的并行度来取得最佳的执行效果

```SQL
select /*+SET_VAR("parallel_pipeline_task_num=8")*/ * from nation, lineitem where lineitem.l_suppkey = nation.n_nationkey
select /*+SET_VAR("parallel_pipeline_task_num=8,runtime_filter_mode=global")*/ * from nation, lineitem where lineitem.l_suppkey = nation.n_nationkey
```

### 会话级别调整

通过 session variables 来调整会话级别的并行度，session 中的所有查询语句都将以指定的并行度执行。请注意，即使是单行查询的 SQL，也会使用该并行度，可能导致性能下降。

```SQL
set parallel_pipeline_task_num = 8;
```

### 全局调整

如果需要全局调整，通常涉及 cpu 利用率的调整，可以 global 设置并行度

```SQL
set global parallel_pipeline_task_num = 8;
```

## 数据分片和并行度

从 2.1 版本开始，Doris 支持并行度和数据分片数量的解耦。

在之前的版本中，并行度不能大于查询涉及到的数据分片数量。比如一个查询涉及到 5 个分片（Tablet），则最大的 Scan 并发度只有 5。这会导致一些较大的数据分片无法进行并发读取。

新版本中，Doris 支持分片内部的并发读取。该功能自动开启，无需用户设置。

但需注意，该功能仅支持 Duplicate 和 Unique Key Merge-On-Write 表模型。对于 Aggregate 和 Unique Key Merge-On-Read 模型不适用。这两种模型下，查询并行度依然受限于分片数量。

## 最佳实践

### 案例 1：并行度过高导致高并发压力场景，CPU 使用率过高

当线上观察到 CPU 使用率过高，影响到部分低时延查询的性能时，可以考虑通过调整查询并行度来降低 CPU 使用率。由于 Doris 的设计理念是优先使用更多资源以最快速度获取查询结果，在某些线上资源紧张的场景下，可能会导致性能表现不佳。因此，适当调整并行度可以在资源有限的情况下提升查询的整体稳定性和效率。

设置并行度从默认的 0（CPU 核数的一半）到 4：

```SQL
set global parallel_pipeline_task_num = 4;
```

global 设置后，对于当前链接和新建链接全局生效，已有的其他链接不生效。如果需要即时全部生效，可以重启 fe。调整之后，CPU 使用率降低到原先高峰值的 60%，降低了部分时延较低的查询的影响。

### 案例 2：调高并行度，进一步利用 CPU 加速查询

当前 Doris 默认的并行度为 CPU 核数的一半，部分计算密集型的场景并不能充分利用满 CPU 进行查询加速，

```SQL
select sum(if(t2.value is null, 0, 1)) exist_value, sum(if(t2.value is null, 1, 0)) no_exist_value
from  t1 left join  t2 on t1.key = t2.key;
```

在左表 20 亿，右表 500 万的场景上，上述 SQL 需要执行 28s。观察 Profile：

```SQL
HASH_JOIN_OPERATOR (id=3 , nereids_id=448):
  - PlanInfo
      - join op: LEFT OUTER JOIN(BROADCAST)[]
      - equal join conjunct: (value = value)
      - cardinality=2,462,330,332
      - vec output tuple id: 5
      - output tuple id: 5
      - vIntermediate tuple ids: 4 
      - hash output slot ids: 16 
      - projections: value
      - project output tuple id: 5
  - BlocksProduced: sum 360.099K (360099), avg 45.012K (45012), max 45.014K (45014), min 45.011K (45011)
  - CloseTime: avg 8.44us, max 13.327us, min 5.574us
  - ExecTime: avg 26sec153ms, max 26sec261ms, min 26sec33ms
  - InitTime: avg 7.122us, max 13.395us, min 4.541us
  - MemoryUsage: sum , avg , max , min 
    - PeakMemoryUsage: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
    - ProbeKeyArena: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
  - OpenTime: avg 2.967us, max 4.120us, min 1.562us
  - ProbeRows: sum 1.4662330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
  - ProjectionTime: avg 165.392ms, max 169.762ms, min 161.727ms
  - RowsProduced: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
```

这里主要的时间耗时：`ExecTime: avg 26sec153ms, max 26sec261ms, min 26sec33ms`都发生在 Join 算子上，同时处理的数据总量：`ProbeRows: sum 1.4662330332B`有 14 亿，这是一个典型的 CPU 密集的运算情况。观察机器监控，发现 CPU 资源没有打满，CPU 利用率为 60%，此时可以考虑调高并行度来进一步利用空闲的 CPU 资源进行加速。

设置并行度如下：

```SQL
set parallel_pipeline_task_num = 16;
```

查询耗时从 28s 降低到 19s，cpu 利用率从 60% 上升到 90%。

## 总结

通常用户不需要介入调整查询并行度，如需要调整，需要注意以下事项：

1. 建议从 CPU 利用率出发。通过 PROFILE 工具输出观察是否是 CPU 瓶颈，尝试进行并行度的合理修改
2. 单 SQL 调整比较安全，尽量不要全局做过于激进的修改
