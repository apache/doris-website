---
{
    "title": "ARRAY_UNION",
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

将多个数组进行合并，不包含重复元素，生成一个新数组

## 语法

```sql
ARRAY_UNION(<array>, <array> [, ... ])
```

## 参数

| 参数 | 说明 |
|--|--|
| `<array>` | 待合并的数组 |

## 返回值

返回一个数组，包含array1和array2的并集中的所有元素，不包含重复项，如果输入参数为NULL，则返回NULL

## 举例

```sql
SELECT ARRAY_UNION([1, 2, 3, 6],[1, 2, 5]),ARRAY_UNION([1, 4, 3, 5, NULL],[1,6,10]);
```

```text
+--------------------------------------+---------------------------------------------+
| array_union([1, 2, 3, 6], [1, 2, 5]) | array_union([1, 4, 3, 5, NULL], [1, 6, 10]) |
+--------------------------------------+---------------------------------------------+
| [3, 2, 1, 6, 5]                      | [null, 10, 3, 1, 6, 4, 5]                   |
+--------------------------------------+---------------------------------------------+
```
