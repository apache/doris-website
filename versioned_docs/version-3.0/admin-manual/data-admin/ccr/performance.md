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

The performance data in this document is based on the default configuration. If you are facing high network latency or high throughput write scenarios, you can refer to the [Operation Manual](manual.md) for optimization.

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

1. Create the database and tables for TPC-H 1T in the upstream cluster.
2. Create a synchronization job for the TPC-H 1T database.
3. Wait for the TPC-H 1T data import to complete and record the completion time.
4. Wait for the downstream data synchronization to complete and record the completion time.

### Test Conclusion
Incremental synchronization time difference: 33 seconds

---

## Full Synchronization Performance Test

### Test Steps
1. Create the library and table information for TPC-H 1T in the upstream cluster and complete the data import, recording the completion time.
2. Create a synchronization job for the TPC-H 1T database.
3. Wait for the downstream data synchronization to complete and record the completion time.

### Test Conclusion
Full synchronization time difference: 6 minutes 1 second

---

## Flink Synchronization Performance Test

### Test Steps
1. Use Flink to import 100,000,000 records in the upstream.
2. Create a synchronization job for the library and table.
3. Observe the difference between the downstream synchronization completion time and the upstream import completion time at each stage (e.g., 1,000,000 records, 2,000,000 records, etc.).
4. Record the last import completion time in the upstream.
5. Record the downstream synchronization completion time.

### Test Conclusion
The **lag time** at each stage is maintained within `5 seconds`.

