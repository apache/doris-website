---
{
"title": "并行度调优",
"language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# 并行度调优

Doris 的查询是一个MPP的执行框架，每一条查询都会在多个BE上并行执行；同时，在单个BE内部也会采用多线程并行的方式来加速查询的执行效率，目前所有的语句（包括Query，DML，DDL）均支持并行执行。

单个BE内并行度的控制参数是：parallel_pipeline_task_num，是指单个Fragment在执行时所使用的工作任务数。

## **并行度调优的原则**

parallel_pipeline_task_num设定目的是为了充分利用多核资源，降低查询的延迟；但是，为了多核并行执行，通常会引入一些数据Shuffle算子，以及多线程之间同步的逻辑，这也会带来一些不必要的资源浪费。

Doris中默认值为0，即BE的CPU核数目的一半，这个值考虑了单查询和并发的资源利用的情况，通常不需要用户介入调整。当存在性能瓶颈时可以参考下面示例进行必要的调整。Doris在持续完善自适应的策略，通常建议在特定场景或SQL级别进行必要的调整。

### **示例**

假设BE的CPU核数为16：

1. 对于单表的简单操作（如单表点差、where扫描获取少量数据，limit少量数据，命中物化视图) **并行度可设置为1**

说明：单表的简单操作，只有一个Fragment，查询的瓶颈通常在数据扫描处理上，数据扫描线程和查询执行的线程是分开的，数据扫描线程会自适应的做并行的扫描，这里的瓶颈不是查询线程，并行度可以直接设置为1。

2. 对于两表 `JOIN` 的查询/聚合查询，如果数据量很大，确认是CPU瓶颈型查询，**并行度可设置为16**。

说明：对于两表 `JOIN`/聚合查询，这类数据计算密集型的查询，如果观察CPU没有打满，可以考虑在默认值的基础上，继续调大并行度，利用Pipeline执行引擎的并行能力，充分利用CPU资源参与计算。并不能保证每个PipelineTask都能将分配给它的CPU资源使用到极限。因此，可以适当调整并行度，比如设为16，以更充分地利用 CPU。然而，不应无限制地增加并行度，设置为48根本不会带来实质性的收益，反而会增加线程调度开销和框架调度开销。

3. 对于压力测试场景，压测的多个查询的任务本身就能够充分利用CPU，可以考虑**并行度设置为1**。

说明：对于压力测试场景，压测的查询的任务足够多。过大的并行度同样带来了线程调度开销和框架调度开销，这里需要设置为1是比较合理的。

4. 复杂查询的情况要根据Profile和机器负载，灵活调整，这里建议使用默认值，如果不合适可以尝试4-2-1的阶梯方式调整，观察查询表现和机器负载。

## **并行度调优的方法**

Doris可以手动指定查询的并行度，以调整查询执行时并行执行的效率。

### **SQL级别调整：**

通过SQL HINT 来指定单个SQL的并行度，这样可以灵活控制不同SQL的并行度来取得最佳的执行效果

```SQL
select /*SET_VAR("parallel_pipeline_task_num=8")*/ * from nation, lineitem where lineitem.l_suppkey = nation.n_nationkey
```

#### **会话级别调整：**

通过session variables来调整会话级别的并行度，session 中的所有查询语句都将以指定的并行度执行。请注意，即使是单行查询的 SQL，也会使用该并行度，可能导致性能下降。

```SQL
set parallel_pipeline_task_num = 8;
```

#### **全局调整：**

如果需要全局调整，通常涉及cpu利用率的调整，可以global设置并行度

```SQL
set global parallel_pipeline_task_num = 8;
```
