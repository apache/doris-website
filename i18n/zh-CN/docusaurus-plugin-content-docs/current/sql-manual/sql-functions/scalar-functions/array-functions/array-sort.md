---
{
    "title": "ARRAY_SORT",
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

将数组中的元素升序排列

## 语法

```sql
ARRAY_SORT(<arr>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<arr>` | 对应数组 |

## 返回值

返回按升序排列后的数组，如果输入数组为 NULL，则返回 NULL。如果数组元素包含 NULL, 则输出的排序数组会将 NULL 放在最前面。

## 举例

```sql
SELECT ARRAY_SORT([1, 2, 3, 6]),ARRAY_SORT([1, 4, 3, 5, NULL]),ARRAY_SORT([NULL]);
```

```text
+--------------------------+--------------------------------+--------------------+
| array_sort([1, 2, 3, 6]) | array_sort([1, 4, 3, 5, NULL]) | array_sort([NULL]) |
+--------------------------+--------------------------------+--------------------+
| [1, 2, 3, 6]             | [null, 1, 3, 4, 5]             | [null]             |
+--------------------------+--------------------------------+--------------------+
```
