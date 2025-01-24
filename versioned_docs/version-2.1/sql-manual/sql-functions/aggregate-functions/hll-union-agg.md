---
{
    "title": "HLL_UNION_AGG",
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

## Description

The HLL_UNION_AGG function is an aggregate function, which is mainly used to merge multiple HyperLogLog data structures and estimate the approximate value of the combined cardinality.

## Syntax

```sql
hll_union_agg(<hll>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<hll>` | The HyperLogLog type expression to be calculated |

## Return Value

Returns the cardinality value of type BIGINT.

## Example

```sql
select HLL_UNION_AGG(uv_set) from test_uv;
```

```text
+-------------------------+
| HLL_UNION_AGG(`uv_set`) |
+-------------------------+
| 17721                   |
+-------------------------+
```