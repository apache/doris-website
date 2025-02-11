---
{
    "title": "ARRAY_SLICE",
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

指定起始位置和长度,从一个数组中提取一部分元素，形成一个新的子数组

## 语法

```sql
ARRAY_SLICE(<arr>, <off>, <len>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<arr>` | 对应数组 |
| `<off>` | 起始位置，如果off是正数，则表示从左侧开始的偏移量，如果off是负数，则表示从右侧开始的偏移量，当指定的off不在数组的实际范围内，返回空数组 |
| `<len>` | 提前长度，如果len是负数，则表示长度为0 |

## 返回值

返回一个子数组，包含所有从指定位置开始的指定长度的元素，如果输入参数为NULL，则返回NULL

## 举例

```sql
SELECT ARRAY_SLICE([1, 2, 3, 6],2,3),ARRAY_SLICE([1, 4, 3, 5, NULL],-2,1),ARRAY_SLICE([1, 3, 5],0);
```

```text
+---------------------------------+----------------------------------------+---------------------------+
| array_slice([1, 2, 3, 6], 2, 3) | array_slice([1, 4, 3, 5, NULL], -2, 1) | array_slice([1, 3, 5], 0) |
+---------------------------------+----------------------------------------+---------------------------+
| [2, 3, 6]                       | [5]                                    | []                        |
+---------------------------------+----------------------------------------+---------------------------+
```
