---
{
    "title": "PERCENTILE_APPROX_WEIGHTED",
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

## PERCENTILE_APPROX_WEIGHTED
### description
#### Syntax

`PERCENTILE_APPROX_WEIGHTED(expr, w ,DOUBLE p [, DOUBLE compression])`


该函数和 PERCENTILE_APPROX 类似，唯一的区别是多了一个参数 w，用来表示 expr 出现的次数。

### example
```
mysql >select * from quantile_weighted_table order by k;
+------+------+
| k    | w    |
+------+------+
|    1 |    2 |
|    3 |    1 |
|    5 |    2 |
+------+------+


mysql >select percentile_approx_weighted(k,w,0.55) from quantile_weighted_table;
+----------------------------------------------------------------------------------------+
| percentile_approx_weighted(cast(k as DOUBLE), cast(w as DOUBLE), cast(0.55 as DOUBLE)) |
+----------------------------------------------------------------------------------------+
|                                                                     3.3333332538604736 |
+----------------------------------------------------------------------------------------+

```

### keywords
PERCENTILE_APPROX,PERCENTILE,APPROX,PERCENTILE_APPROX_WEIGHTED
