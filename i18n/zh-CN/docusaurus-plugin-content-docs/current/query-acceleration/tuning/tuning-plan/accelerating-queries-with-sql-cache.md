---
{
    "title": "使用 SQL Cache 加速查询",
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

## 概述

关于 SQL Cache 详细实现原理，请参考 [查询缓存（SQL Cache）](../../../query-acceleration/sql-cache-manual)章节

## 案例

详细案例请参考 [查询缓存（SQL Cache）](../../../query-acceleration/sql-cache-manual)章节

## 总结

SQL Cache 是 Doris 提供的一种查询优化机制，可以显著提升查询性能。在使用的时候需要注意：

:::tip 提示
- SQL Cache 不适用于包含生成随机值的函数 (如 `random()`) 的查询，因为这会导致查询结果失去随机性。
- 目前不支持使用部分指标的缓存结果来满足查询更多指标的需求。例如，之前查询了 2 个指标的缓存不能用于查询 3 个指标的情况。
- 通过合理使用 SQL Cache，可以显著提升 Doris 的查询性能，特别是在数据更新频率较低的场景中。在实际应用中，需要根据具体的数据特征和查询模式来调整缓存参数，以获得最佳的性能提升。
:::
