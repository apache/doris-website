---
{
    "title": "MAP_SIZE",
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

## 描述

计算 Map 中元素的个数

## 语法

```sql
MAP_SIZE(<map>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<map>` | 输入的 map 内容 |

## 返回值

返回 Map 中元素的个数

## 举例

```sql
select map_size(map()),map_size(map(1, "100", 0.1, 2));
```

```text
+-----------------+-------------------------------------------------------------------------------------------------+
| map_size(map()) | map_size(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT))) |
+-----------------+-------------------------------------------------------------------------------------------------+
|               0 |                                                                                               2 |
+-----------------+-------------------------------------------------------------------------------------------------+
```
