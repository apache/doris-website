---
{
    "title": "PipelineX Execution Engine",
    "language": "en",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4
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


The PipelineX execution engine is an experimental feature introduced in version 2.1 of Doris. Its goal is to address four major issues with the Doris pipeline engine:

1. In terms of concurrent execution, the current Doris execution concurrency is constrained by two factors: parameters set by the FE and the limitation imposed by the number of buckets in the storage layer. This static concurrency prevents the execution engine from fully utilizing machine resources.

2. In terms of execution logic, the current Doris implementation incurs some fixed overhead. For example, the expression part of each instance is independent of others, but the initialization parameters for instances have many common parts. As a result, many redundant initialization steps are required.

3. In terms of scheduling logic, the current pipeline scheduler places all blocked tasks in a blocking queue, which is polled by a single thread to move executable tasks to the runnable queue. Consequently, during query execution, one CPU core is consistently dedicated to scheduling overhead.

4. In terms of profiling, the current pipeline implementation does not provide users with simple and understandable metrics.

:::tip
To use the latest PipelineX execution engine, please refer to Doris version 2.1.
:::