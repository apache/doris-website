---
{
"title": "BIT_COUNT",
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
用于返回一个整数值的二进制表示中 1 的位数。这个函数可以用于快速统计某个整数在二进制表示中“活跃”的位数，通常用于分析数据的分布或进行某些位运算

## 语法
```sql
BIT_COUNT( <x>)
```

## 参数
| 参数    | 说明 |
|-------| -- |
| `<x>` | 统计整型 x 的二进制表示中 1 的个数。整型可以是：TINYINT、SMALLINT、INT、BIGINT、LARGEINT |

## 返回值

返回 `<x>` 的二进制表示中 1 的个数

## 举例

```sql
select BIT_COUNT(8), BIT_COUNT(-1);
```
```text
+--------------+---------------+
| bit_count(8) | bit_count(-1) |
+--------------+---------------+
|            1 |             8 |
+--------------+---------------+
```