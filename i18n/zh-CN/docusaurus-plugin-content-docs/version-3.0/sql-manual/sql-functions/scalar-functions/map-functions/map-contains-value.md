---
{
    "title": "MAP_CONTAINS_VALUE",
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

判断给定 `map` 中是否包含特定的值 `value`

## 语法

```sql
MAP_CONTAINS_VALUE(<map>, <value>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<map>` | 输入的 map 内容 |
| `<value>` | 需要检索的 value |

## 返回值

判断给定 `map` 中是否包含特定的值 `value`,存在返回 1 ,不存在返回 0。

## 举例

```sql
select map_contains_value(map(null, 1, 2, null), null),map_contains_value(map(1, "100", 0.1, 2), 101);
```

```text
+-------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
| map_contains_value(map(NULL, 1, 2, NULL), NULL) | map_contains_value(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT)), cast(101 as VARCHAR(3))) |
+-------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
|                                               1 |                                                                                                                                  0 |
+-------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
```
