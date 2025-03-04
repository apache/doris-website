---
{
    "title": "ARRAY_SHUFFLE",
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

将数组中元素进行随机排列

## 别名

- SHUFFLE

## 语法

```sql
ARRAY_SHUFFLE(<array>, <seed>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<array>` | 要进行随机排列的数组 |
| `<seed>` | 可选参数，是设定伪随机数生成器用于生成伪随机数的初始数值 |

## 返回值

将数组中元素进行随机排列。其中，参数 array1 为要进行随机排列的数组，可选参数 seed 是设定伪随机数生成器用于生成伪随机数的初始数值。shuffle 与 array_shuffle 功能相同。

## 举例

```sql
SELECT ARRAY_SHUFFLE([1, 2, 3, 6]),ARRAY_SHUFFLE([1, 4, 3, 5, NULL],1);
```

```text
+-----------------------------+--------------------------------------+
| array_shuffle([1, 2, 3, 6]) | array_shuffle([1, 4, 3, 5, NULL], 1) |
+-----------------------------+--------------------------------------+
| [2, 6, 3, 1]                | [4, 1, 3, 5, null]                   |
+-----------------------------+--------------------------------------+
```
