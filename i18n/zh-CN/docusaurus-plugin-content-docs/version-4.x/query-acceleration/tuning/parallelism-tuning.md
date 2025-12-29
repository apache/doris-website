---
{
    "title": "并行度调优",
    "language": "zh-CN",
    "description": "Doris 的查询是一个 MPP 的执行框架，每一条查询都会在多个 BE 上并行执行；同时，在单个 BE 内部也会采用多线程并行的方式来加速查询的执行效率，目前所有的语句（包括 Query，DML，DDL）均支持并行执行。"
}
---

# 并行度调优

Doris 的查询是一个 MPP 的执行框架，每一条查询都会在多个 BE 上并行执行；同时，在单个 BE 内部也会采用多线程并行的方式来加速查询的执行效率，目前所有的语句（包括 Query，DML，DDL）均支持并行执行。

单个 BE 内并行度的控制参数是：parallel_pipeline_task_num，是指单个 Fragment 在执行时所使用的工作任务数。

## 并行度调优的原则

parallel_pipeline_task_num 设定目的是为了充分利用多核资源，降低查询的延迟；但是，为了多核并行执行，通常会引入一些数据 Shuffle 算子，以及多线程之间同步的逻辑，这也会带来一些不必要的资源浪费。

Doris 中默认值为 0，即 BE 的 CPU 核数目的一半，这个值考虑了单查询和并发的资源利用的情况，通常不需要用户介入调整。当存在性能瓶颈时可以参考下面示例进行必要的调整。Doris 在持续完善自适应的策略，通常建议在特定场景或 SQL 级别进行必要的调整。

### 示例

假设 BE 的 CPU 核数为 16：

1. 对于单表的简单操作（如单表点查、where 扫描获取少量数据，limit 少量数据，命中物化视图) **并行度可设置为 1**

说明：单表的简单操作，只有一个 Fragment，查询的瓶颈通常在数据扫描处理上，数据扫描线程和查询执行的线程是分开的，数据扫描线程会自适应的做并行的扫描，这里的瓶颈不是查询线程，并行度可以直接设置为 1。

2. 对于两表 `JOIN` 的查询/聚合查询，如果数据量很大，确认是 CPU 瓶颈型查询，**并行度可设置为 16**。

说明：对于两表 `JOIN`/聚合查询，这类数据计算密集型的查询，如果观察 CPU 没有打满，可以考虑在默认值的基础上，继续调大并行度，利用 Pipeline 执行引擎的并行能力，充分利用 CPU 资源参与计算。并不能保证每个 PipelineTask 都能将分配给它的 CPU 资源使用到极限。因此，可以适当调整并行度，比如设为 16，以更充分地利用 CPU。然而，不应无限制地增加并行度，设置为 48 根本不会带来实质性的收益，反而会增加线程调度开销和框架调度开销。

3. 对于压力测试场景，压测的多个查询的任务本身就能够充分利用 CPU，可以考虑**并行度设置为 1**。

说明：对于压力测试场景，压测的查询的任务足够多。过大的并行度同样带来了线程调度开销和框架调度开销，这里需要设置为 1 是比较合理的。

4. 复杂查询的情况要根据 Profile 和机器负载，灵活调整，这里建议使用默认值，如果不合适可以尝试 4-2-1 的阶梯方式调整，观察查询表现和机器负载。

## 并行度调优的方法

Doris 可以手动指定查询的并行度，以调整查询执行时并行执行的效率。

### SQL 级别调整：

通过 SQL HINT 来指定单个 SQL 的并行度，这样可以灵活控制不同 SQL 的并行度来取得最佳的执行效果

```SQL
select /*+SET_VAR("parallel_pipeline_task_num=8")*/ * from nation, lineitem where lineitem.l_suppkey = nation.n_nationkey
select /*+SET_VAR("parallel_pipeline_task_num=8,runtime_filter_mode=global")*/ * from nation, lineitem where lineitem.l_suppkey = nation.n_nationkey
```

#### 会话级别调整：

通过 session variables 来调整会话级别的并行度，session 中的所有查询语句都将以指定的并行度执行。请注意，即使是单行查询的 SQL，也会使用该并行度，可能导致性能下降。

```SQL
set parallel_pipeline_task_num = 8;
```

#### 全局调整：

如果需要全局调整，通常涉及 cpu 利用率的调整，可以 global 设置并行度

```SQL
set global parallel_pipeline_task_num = 8;
```
