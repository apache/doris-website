---
{
    "title": "使用 Runtime Filter 高阶优化",
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


Join Runtime Filter (以下简称 JRF) 是一种优化技术，它根据运行时数据在 Join 节点通过 Join 条件动态生成 Filter。此技术不仅能降低 Join Probe 的规模，还能有效减少数据 IO 和网络传输。

关于如何使用 Runtime Filter 进行查询调优，详细请参考 [Runtime Filter 调优](../../../query-acceleration/tuning/runtime-filter#调优)部分介绍