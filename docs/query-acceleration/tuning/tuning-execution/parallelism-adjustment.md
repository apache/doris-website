---
{
"title": "Parallelism Adjustment",
"language": "en"
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

# Parallelism Adjustment

## Overview

In actual production scenarios, performance issues often occur due to unreasonable parallelism settings. The following cases list examples of optimization by adjusting parallelism.

## Case 1: High Parallelism Leads to High CPU Usage in High Concurrency Pressure Scenarios

When high CPU usage is observed online, affecting the performance of some low-latency queries, consider reducing CPU usage by adjusting the query parallelism. Since Doris's design concept is to prioritize using more resources to obtain query results as quickly as possible, in some scenarios with tight online resources, this may lead to poor performance. Therefore, appropriate adjustment of parallelism can improve the overall stability and efficiency of queries under limited resources.
Set the parallelism from the default 0 (half of the number of CPU cores) to 4:

```SQL
set global parallel_pipeline_task_num = 4;
```

Since this parameter takes effect at the session level, consider restarting the FE to make the setting globally effective if necessary.
After the adjustment, the CPU usage was reduced to 60% of the previous peak value, reducing the impact on some low-latency queries.

## Case 2: Increase Parallelism to Further Utilize CPU to Accelerate Queries

The current default parallelism in Doris is half of the number of CPU cores, and some compute-intensive scenarios cannot fully utilize the CPU for query acceleration.

```SQL
select sum(if(t2.value is null, 0, 1)) exist_value, sum(if(t2.value is null, 1, 0)) no_exist_value
from  t1 left join  t2 on t1.key = t2.key;
```

In a scenario with 2 billion rows in the left table and 5 million rows in the right table, the above SQL takes 28 seconds to execute. Observe the Profile:

```SQL
 HASH_JOIN_OPERATOR (id=3, nereids_id=448):
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
                - MemoryUsage: sum, avg, max, min 
                  - PeakMemoryUsage: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
                  - ProbeKeyArena: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
                - OpenTime: avg 2.967us, max 4.120us, min 1.562us
                - ProbeRows: sum 1.4662330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
                - ProjectionTime: avg 165.392ms, max 169.762ms, min 161.727ms
                - RowsProduced: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
```

The main time-consuming part here: `ExecTime: avg 26sec153ms, max 26sec261ms, min 26sec33ms` all occurs in the Join operator, and the total amount of data processed: `ProbeRows: sum 1.4662330332B` is 1.4 billion. This is a typical CPU-intensive computing situation. By observing the machine monitoring, it is found that the CPU resources are not fully utilized, and the CPU utilization is 60%. At this time, consider increasing the parallelism to further utilize the idle CPU resources for acceleration.

Set the parallelism as follows:

```SQL
set parallel_pipeline_task_num = 16;
```

The query time was reduced from 28 seconds to 19 seconds, and the CPU utilization increased from 60% to 90%.

## Summary

Usually, users do not need to intervene in adjusting the query parallelism. If adjustment is required, the following points should be noted:

1. It is recommended to start from CPU utilization. Observe whether it is a CPU bottleneck through the output of the PROFILE tool and try to make reasonable modifications to the parallelism.
2. Adjusting a single SQL is relatively safe. Try not to make overly aggressive global modifications.