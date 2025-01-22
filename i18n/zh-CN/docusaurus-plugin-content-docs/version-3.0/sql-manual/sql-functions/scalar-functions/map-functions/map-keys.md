---
{
    "title": "MAP_KEYS",
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

将给定 `map` 的键提取成一个对应类型的 `ARRAY`

## 语法

```sql
MAP_KEYS(<map>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<map>` | 输入的 map 内容 |

## 返回值

将给定 `map` 的键提取成一个对应类型的 `ARRAY`

## 举例

```sql
select map_keys(map()),map_keys(map(1, "100", 0.1, 2));
```

```text
+-----------------+-------------------------------------------------------------------------------------------------+
| map_keys(map()) | map_keys(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT))) |
+-----------------+-------------------------------------------------------------------------------------------------+
| []              | [1.0, 0.1]                                                                                      |
+-----------------+-------------------------------------------------------------------------------------------------+
```
