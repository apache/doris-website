---
{
    "title": "统计信息",
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

Doris 支持对外部数据源的表，如 Hive、Iceberg、Paimon 等进行自动或手动的统计信息收集。统计信息准确性直接决定了代价估算的准确性，对于选择最优查询计划至关重要，尤其在复杂查询场景下能显著提升查询执行效率。

具体可参阅 [统计信息](../query-acceleration/optimization-technology-principle/statistics#外表收集) 文档中的【外表收集】部分。

