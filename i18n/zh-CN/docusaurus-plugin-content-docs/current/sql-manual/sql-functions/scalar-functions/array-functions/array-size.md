---
{
    "title": "ARRAY_SIZE",
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

计算数组中元素的数量

## 别名

- SIZE
- CARDINALITY

## 语法

```sql
ARRAY_SIZE(<arr>) 
```

## 参数

| 参数 | 说明 |
|--|--|
| `<arr>` | 待计算的数组 |

## 返回值

返回数组中元素数量，如果输入数组为 NULL，则返回 NULL

## 举例

```sql
SELECT ARRAY_SIZE(['a', 'b', 'c']),ARRAY_SIZE([NULL]),ARRAY_SIZE([]);
```

```text
+------------------------------+---------------------+-----------------+
| cardinality(['a', 'b', 'c']) | cardinality([NULL]) | cardinality([]) |
+------------------------------+---------------------+-----------------+
|                            3 |                   1 |               0 |
+------------------------------+---------------------+-----------------+
```
