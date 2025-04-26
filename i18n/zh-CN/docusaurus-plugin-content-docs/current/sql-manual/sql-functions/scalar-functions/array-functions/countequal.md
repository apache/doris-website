---
{
    "title": "COUNTEQUAL",
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

判断数组中包含 value 元素的个数

## 语法

```sql
COUNTEQUAL(<arr>, <value>)
```

## 参数

| 参数 | 说明   |
|--|------|
| `<arr>` | 输入数组 |
| `<value>` | 判断元素 |

## 返回值

返回判断的结果如下：num：value 在 array 中的数量；0：value 不存在数组 arr 中；NULL：如果数组为 NULL。

## 举例

```sql
SELECT COUNTEQUAL(NULL,1),COUNTEQUAL([1, 2, 3, 'c'],2),COUNTEQUAL([],'b');
```

```text
+---------------------+---------------------------------------------------+------------------------------------------+
| countequal(NULL, 1) | countequal(['1', '2', '3', 'c'], cast(2 as TEXT)) | countequal(cast([] as ARRAY<TEXT>), 'b') |
+---------------------+---------------------------------------------------+------------------------------------------+
|                NULL |                                                 1 |                                        0 |
+---------------------+---------------------------------------------------+------------------------------------------+
```
