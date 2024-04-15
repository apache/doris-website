---
{
    "title": "WINDOW_FUNCTION_FIRST_VALUE",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## WINDOW FUNCTION FIRST_VALUE
### description

:::info 备注
自 2.0.9 开始支持 ignore_null 用法
:::

FIRST_VALUE() 返回窗口范围内的第一个值， ignore_null 决定是否忽略 null 值，参数 ignore_null 默认值为 false 。

```sql
FIRST_VALUE(expr[, ignore_null]) OVER(partition_by_clause order_by_clause [window_clause])
```

### example


我们有如下数据

```sql
 select id, myday, time_col, state from t;
 
 | id   | myday | time_col    | state |
 |------|-------|-------------|-------|
 |    3 |    21 | 04-21-13    |     3 |
 |    7 |    22 | 04-22-10-24 |  NULL |
 |    8 |    22 | 04-22-10-25 |     9 |
 |   10 |    23 | 04-23-12    |    10 |
 |    4 |    22 | 04-22-10-21 |  NULL |
 |    9 |    23 | 04-23-11    |  NULL |
 |    1 |    21 | 04-21-11    |  NULL |
 |    5 |    22 | 04-22-10-22 |  NULL |
 |   12 |    24 | 02-24-10-21 |  NULL |
 |    2 |    21 | 04-21-12    |     2 |
 |    6 |    22 | 04-22-10-23 |     5 |
 |   11 |    23 | 04-23-13    |  NULL |
```

使用 FIRST_VALUE()，根据 myday 分组，返回每个分组中第一个 state 的值：

```sql
select * , 
first_value(`state`, 1) over(partition by `myday` order by `time_col` rows between 1 preceding and 1 following) as ignore_null,
first_value(`state`, 0) over(partition by `myday` order by `time_col` rows between 1 preceding and 1 following) as not_ignore_null,
first_value(`state`) over(partition by `myday` order by `time_col` rows between 1 preceding and 1 following) as ignore_null_default
from t order by `id`, `myday`, `time_col`;

| id   | myday | time_col    | state | ignore_null | not_ignore_null | ignore_null_default |
|------|-------|-------------|-------|-------------|-----------------|---------------------|
|    1 |    21 | 04-21-11    |  NULL |           2 |            NULL |                NULL |
|    2 |    21 | 04-21-12    |     2 |           2 |            NULL |                NULL |
|    3 |    21 | 04-21-13    |     3 |           2 |               2 |                   2 |
|    4 |    22 | 04-22-10-21 |  NULL |        NULL |            NULL |                NULL |
|    5 |    22 | 04-22-10-22 |  NULL |           5 |            NULL |                NULL |
|    6 |    22 | 04-22-10-23 |     5 |           5 |            NULL |                NULL |
|    7 |    22 | 04-22-10-24 |  NULL |           5 |               5 |                   5 |
|    8 |    22 | 04-22-10-25 |     9 |           9 |            NULL |                NULL |
|    9 |    23 | 04-23-11    |  NULL |          10 |            NULL |                NULL |
|   10 |    23 | 04-23-12    |    10 |          10 |            NULL |                NULL |
|   11 |    23 | 04-23-13    |  NULL |          10 |              10 |                  10 |
|   12 |    24 | 02-24-10-21 |  NULL |        NULL |            NULL |                NULL |
```

### keywords

    WINDOW,FUNCTION,FIRST_VALUE
