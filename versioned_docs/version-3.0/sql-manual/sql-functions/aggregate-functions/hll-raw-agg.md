---
{
    "title": "HLL_RAW_AGG",
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

The HLL_RAW_AGG function is an aggregate function, which is mainly used to merge multiple HyperLogLog data structures.

## Alias

- HLL_UNION

## Syntax

```sql
HLL_RAW_AGG(<hll>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<hll>` | The HyperLogLog type expression to be calculated |

## Return Value

Returns the aggregated value of type HyperLogLog.

## Example

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(uv_set)) from test_uv;
```

```text
+------------------------------------------+
|   HLL_CARDINALITY(HLL_RAW_AGG(`uv_set`)) |
+------------------------------------------+
|                                    17721 |
+------------------------------------------+
```