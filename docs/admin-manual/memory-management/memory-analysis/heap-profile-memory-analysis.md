---
{
    "title": "Heap Profile Memory Analysis",
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

Heap Profile supports real-time viewing of process memory usage and call stacks, so this usually requires some understanding of the code. Doris uses Jemalloc as the default Allocator. For the usage of Jemalloc Heap Profile, refer to [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1). It should be noted that Heap Profile records virtual memory. You need to modify the configuration and restart the Doris BE process, and the phenomenon can be reproduced.

If you see the `Segment`, `TabletSchema`, and `ColumnReader` fields in the call stack with a large memory share of Heap Profile, it means that the metadata occupies a large amount of memory.

If the BE memory does not decrease when the cluster is idle after running for a period of time, then you can see fields such as `Agg`, `Join`, `Filter`, `Sort`, and `Scan` in the call stack with a large memory share in the Heap Profile. If the BE process memory monitoring in the corresponding time period shows a continuous upward trend, then there is reason to suspect that there is a memory leak. Continue to analyze the code based on the call stack.

If you see fields such as `Agg`, `Join`, `Filter`, `Sort`, and `Scan` in the call stack with a large memory share in the Heap Profile during task execution on the cluster, and the memory is released normally after the task is completed, it means that most of the memory is used by the running tasks and there is no leak. If the value of `Label=query, Type=overview` Memory Tracker accounts for a smaller proportion of the total memory than the memory call stack containing the above fields in the Heap Profile, it means that the statistics of `Label=query, Type=overview` Memory Tracker are inaccurate, and you can provide timely feedback in the community.
