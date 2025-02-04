---
{
    "title": "APPROX_COUNT_DISTINCT",
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

APPROX_COUNT_DISTINCT 函数基于 HyperLogLog 算法实现，使用固定大小的内存估算列基数。
该算法基于尾部零分布假设进行计算，具体精确程度取决于数据分布。基于 Doris 使用的固定桶大小，该算法相对标准误差为 0.8125%
更详细具体的分析，详见[相关论文](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)

## 语法

```sql
APPROX_COUNT_DISTINCT(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要获取值的表达式 |

## 返回值

返回 BIGINT 类型的值。

## 举例

```sql
select approx_count_distinct(query_id) from log_statis group by datetime;
```

```text
+-----------------+
| approx_count_distinct(`query_id`) |
+-----------------+
| 17721           |
+-----------------+
```
