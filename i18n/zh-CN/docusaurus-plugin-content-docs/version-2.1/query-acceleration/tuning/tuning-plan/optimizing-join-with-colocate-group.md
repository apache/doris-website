---
{
    "title": "使用 Colocate Group 优化 Join",
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

定义 Colocate Group 是一种高效的 Join 方式，通过这种方式，执行引擎能有效地规避 Join 操作中输入数据的传输开销（关于 Colocate Group 的介绍可参考 [JOIN](../../../query-data/join)）

然而，在某些场景下，即使已经成功建立了 Colocate Group，执行计划（plan）仍然可能会显示为 Shuffle Join 或 Bucket Shuffle Join。这种情况通常发生在 Doris 正在进行数据整理的过程中，比如，它可能在 BE 间迁移 tablet，以确保数据在多个 BE 之间的分布达到更加均衡的状态。

通过命令`show proc "/colocation_group";`可以查看 Colocate Group 状态，如下图所示：`IsStable` 出现 false，表示有 `colocation_group` 不可用的情况。

![使用 Colocate Group 优化 Join](/images/use-colocate-group.jpg)