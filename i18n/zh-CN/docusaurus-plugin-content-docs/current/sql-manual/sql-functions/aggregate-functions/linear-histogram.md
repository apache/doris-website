---
{
    "title": "LINEAR_HISTOGRAM",
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

## Description
### Syntax

`LINEAR_HISTOGRAM(expr, DOUBLE interval[, DOUBLE offset)`

linear_histogram 函数用于描述数据分布情况，它使用“等宽”的分桶策略，并按照数据的值大小进行分桶。

参数说明：

- `interval`：必须项。桶的宽度。
- `offset`：可选项。默认为 0，范围是 `[0, interval)`。

## Example

```
mysql> select linear_histogram(a, 2) from histogram_test;
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| linear_histogram(a, cast(2 as DOUBLE))                                                                                                                                                                                                                                                                                                           |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":6,"buckets":[{"lower":0.0,"upper":2.0,"count":2,"acc_count":2},{"lower":2.0,"upper":4.0,"count":4,"acc_count":6},{"lower":4.0,"upper":6.0,"count":4,"acc_count":10},{"lower":6.0,"upper":8.0,"count":4,"acc_count":14},{"lower":8.0,"upper":10.0,"count":4,"acc_count":18},{"lower":10.0,"upper":12.0,"count":2,"acc_count":20}]} |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

mysql> select linear_histogram(a, 2, 1) from histogram_test;
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| linear_histogram(a, cast(2 as DOUBLE), cast(1 as DOUBLE))                                                                                                                                                                                                                                   |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":5,"buckets":[{"lower":1.0,"upper":3.0,"count":4,"acc_count":4},{"lower":3.0,"upper":5.0,"count":4,"acc_count":8},{"lower":5.0,"upper":7.0,"count":4,"acc_count":12},{"lower":7.0,"upper":9.0,"count":4,"acc_count":16},{"lower":9.0,"upper":11.0,"count":4,"acc_count":20}]} |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

字段说明：

- `num_buckets`：桶的数量。
- `buckets`：直方图所包含的桶。
  - `lower`：桶的下界。（包含在内）
  - `upper`：桶的上界。（不包含在内）
  - `count`：桶内包含的元素数量。
  - `acc_count`：前面桶与当前桶元素的累计总量。


## Keywords

LINEAR_HISTOGRAM