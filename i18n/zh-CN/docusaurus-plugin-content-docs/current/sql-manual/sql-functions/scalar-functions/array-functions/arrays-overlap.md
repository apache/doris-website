---
{
    "title": "ARRAYS_OVERLAP",
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

判断 left 和 right 数组中是否包含公共元素

## 语法

```sql
ARRAYS_OVERLAP(<left>, <right>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<left>` | 待判断的数组 |
| `<right>` | 带判断的数组 |

## 返回值

如果 left 和 right 具有任何非 null 的共同元素，则返回 true。
如果没有非 null 的共同元素且任一数组包含 null，则返回 null。
如果没有非 null 的共同元素，且 left 和 right 都不包含 null，则返回 false。

## 举例

```
select arrays_overlap([1, 2, 3], [1, null]);
+--------------------------------------+
| arrays_overlap([1, 2, 3], [1, null]) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+


select arrays_overlap([2, 3], [1, null]);
+-----------------------------------+
| arrays_overlap([2, 3], [1, null]) |
+-----------------------------------+
|                              NULL |
+-----------------------------------+

select arrays_overlap([2, 3], [1]);
+-----------------------------+
+-----------------------------+
| arrays_overlap([2, 3], [1]) |
+-----------------------------+
|                           0 |
+-----------------------------+
```
