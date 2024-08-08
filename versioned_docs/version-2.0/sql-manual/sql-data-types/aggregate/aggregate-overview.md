---
{
    "title": "Overview",
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


The aggregation data types store aggregation results or intermediate results during aggregation. They are used for accelerating aggregation-heavy queries.

- **[BITMAP](../aggregate/BITMAP.md)**: It is used for exact deduplication, such as in (UV) statistics and audience segmentation. It works in conjunction with BITMAP functions like `bitmap_union`, `bitmap_union_count`, `bitmap_hash`, and `bitmap_hash64`.

- **[HLL](../aggregate/HLL.md)**: It is used for approximate deduplication and provides better performance than `COUNT DISTINCT`. It works in conjunction with HLL functions like `hll_union_agg`, `hll_raw_agg`, `hll_cardinality`, and `hll_hash`.

- **[QUANTILE_STATE](../aggregate/QUANTILE_STATE.md)**: It is used for approximate percentile calculations and offers better performance than the `PERCENTILE` function. It works with functions like `QUANTILE_PERCENT`, `QUANTILE_UNION`, and `TO_QUANTILE_STATE`.

- **[AGG_STATE](../aggregate/AGG_STATE.md)**: It is used to accelerate aggregations, utilized in combination with aggregation function combinators like state/merge/union.


