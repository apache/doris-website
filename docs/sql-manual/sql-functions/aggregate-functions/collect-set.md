---
{
"title": "COLLECT_SET",
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

Aggregation function aggregates all unique values of the specified column, removes duplicate elements, and returns a set type result.

## Alias

- GROUP_UNIQ_ARRAY

## Syntax

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Column or expression to aggregate |
| `<max_size>` | Optional parameter that can be set to limit the size of the resulting array to max_size elements |

## Return Value

The return type is ARRAY. This array contains all values after deduplication. Special case:

- If the value is NULL, it will filter

## Example

```sql
select k1,k2,k3 from collect_set_test order by k1;
```

```text
+------+------------+-------+
| k1   | k2         | k3    |
+------+------------+-------+
|    1 | 2023-01-01 | hello |
|    2 | 2023-01-01 | NULL  |
|    2 | 2023-01-02 | hello |
|    3 | NULL       | world |
|    3 | 2023-01-02 | hello |
|    4 | 2023-01-02 | doris |
|    4 | 2023-01-03 | sql   |
+------+------------+-------+
```

```sql
select collect_set(k1),collect_set(k1,2) from collect_set_test;
```

```text
+-------------------------+--------------------------+
| collect_set(`k1`)       | collect_set(`k1`,2)      |
+-------------------------+--------------------------+
| [4,3,2,1]               | [1,2]                    |
+----------------------------------------------------+
```

```sql
select k1,collect_set(k2),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```

```text
+------+-------------------------+--------------------------+
| k1   | collect_set(`k2`)       | collect_set(`k3`,1)      |
+------+-------------------------+--------------------------+
|    1 | [2023-01-01]            | [hello]                  |
|    2 | [2023-01-01,2023-01-02] | [hello]                  |
|    3 | [2023-01-02]            | [world]                  |
|    4 | [2023-01-02,2023-01-03] | [sql]                    |
+------+-------------------------+--------------------------+
```
