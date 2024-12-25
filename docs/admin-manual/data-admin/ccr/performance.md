---
{
    "title": "Performance",
    "language": "en_US"
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

The performance data in this document is based on the default configuration. If you are facing high network latency or high throughput write scenarios, you can refer to [the operation manual] (manual.md) for optimization.

## Test Dataset
- **Dataset**: TPC-H 1T

## Test Cluster Configuration

| Configuration Item | Upstream Configuration                     | Downstream Configuration                     |
|--------------------|-------------------------------------------|---------------------------------------------|
| FE                 | 2 cores 16 GB                             | 2 cores 16 GB                               |
| BE                 | 3 nodes, 16 cores 64 GB, 3*500 GB per node | 3 nodes, 16 cores 64 GB, 3*500 GB per node |

---

## Incremental Synchronization Performance Test

### Test Steps
1. Create the library table information for TPC-H 1T in the upstream cluster.
2. Create a synchronization task for the TPC-H 1T database.
3. Wait for the TPC-H 1T data import to complete and record the completion time `a`.
   - **Time Record**: `2024-12-05 20:09:48`
4. Wait for the downstream data synchronization to complete and record the completion time `b`.
   - **Time Record**: `2024-12-05 20:10:21.678`
   - **Log Information**: `INFO handle upsert binlog, sub sync state: IngestBinlog, prevCommitSeq: 3271, commitSeq: 3282 job=per_ccr line=ccr/job.`

### Test Conclusion
Incremental synchronization time difference: `b - a = 33 seconds`

---

## Full Synchronization Performance Test

### Test Steps
1. Create the library table information for TPC-H 1T in the upstream cluster and complete the data import, recording the completion time `a`.
   - **Time Record**: `2024-12-05 17:56:56`
2. Create a synchronization task for the TPC-H 1T database.
3. Wait for the downstream data synchronization to complete and record the completion time `b`.
   - **Time Record**: `2024-12-05 18:02:57`

### Test Conclusion
Full synchronization time difference: `b - a = 6 minutes 1 second`

---

## Flink Synchronization Performance Test

### Test Steps
1. Use Flink to import 100,000,000 records of data in the upstream.
2. Create a synchronization task for the library table.
3. Observe the difference between the downstream synchronization completion time and the upstream import completion time at each stage (e.g., 1,000,000 records, 2,000,000 records, etc.).
4. The last import completion time in the upstream is `2024-12-06 12:53:00`.
   - **Log Information**: `2024-12-06 12:53:00,455 INFO org.apache.flink.runtime.executiongraph.ExecutionGraph [] - Source: Custom Source (1/1) (17be78de01ee5175d801c08c1b443771) switched from RUNNING to FINISHED.`
5. The downstream synchronization completion time is `2024-12-06 12:53:01.433`.
   - **Log Information**: `2024-12-06 12:53:01.433 TRACE update job progress done, state: DBIncrementalSync, subState: Done, commitSeq: 12246911, prevCommitSeq: 12246911 job=flink_per_ccr line=ccr/job_progress.go:389`

### Test Conclusion
The **lag time** at each stage is maintained within `5 seconds`.

---

## Summary
- **Incremental Synchronization**: Time difference of approximately 33 seconds.
- **Full Synchronization**: Completion time of approximately 6 minutes 1 second.
- **Flink Synchronization**: Each stage's synchronization delay is within 5 seconds.
