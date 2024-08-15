---
{
    "title": "聚合类型概览",
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

聚合类型存储聚合的结果或者中间状态，用于加速聚合查询，包括下面几种：

1. [BITMAP](../aggregate/BITMAP.md)：用于精确去重，如 UV 统计，人群圈选等场景。配合 bitmap_union、bitmap_union_count、bitmap_hash、bitmap_hash64 等 BITMAP 函数使用。

2. [HLL](../aggregate/HLL.md)：用于近似去重，性能优于 COUNT DISTINCT。配合  hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash 等 HLL 函数使用。

3. [QUANTILE_STATE](../aggregate/QUANTILE_STATE.md)：用于分位数近似计算，性能优于 PERCENTILE。配合 QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE 等函数使用。

4. [AGG_STATE](../aggregate/AGG_STATE.md)：用于聚合计算加速，配合 state/merge/union 聚合函数组合器使用。