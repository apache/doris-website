---
{
"title": "并行度调整",
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

# 并行度调整

## 概述

实际生产场景经常会遇到并行度设置不合理，引起的性能问题。在以下的案例中，列举了调整并行度优化的案例。

## 案例 1：并行度过高导致高并发压力场景，CPU 使用率过高

当线上观察到 CPU 使用率过高，影响到部分低时延查询的性能时，可以考虑通过调整查询并行度来降低 CPU 使用率。由于 Doris 的设计理念是优先使用更多资源以最快速度获取查询结果，在某些线上资源紧张的场景下，可能会导致性能表现不佳。因此，适当调整并行度可以在资源有限的情况下提升查询的整体稳定性和效率。

设置并行度从默认的 0（CPU 核数的一半）到 4：

```SQL
set global parallel_pipeline_task_num = 4;
```

由于该参数是 Session 生效，必要时考虑重启 FE 让该设置全局生效。

调整之后，CPU 使用率降低到原先高峰值的 60%，降低了部分时延较低的查询的影响。

## 案例 2：调高并行度，进一步利用 CPU 加速查询

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