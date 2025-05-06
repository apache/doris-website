---
{
    "title": "QUANTILE_STATE_EMPTY",
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

## Description

返回一个空的 `quantile_state` 类型列。

## Syntax

```sql
QUANTILE_STATE_EMPTY()
```

## Return value

一个空的 `quantile_state` 类型列。

## Example

```sql
select quantile_percent(quantile_union(quantile_state_empty()), 0)
```

结果为

```text
+-------------------------------------------------------------+
| quantile_percent(quantile_union(quantile_state_empty()), 0) |
+-------------------------------------------------------------+
|                                                        NULL |
+-------------------------------------------------------------+
```
