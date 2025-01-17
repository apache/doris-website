---
{
    "title": "WINDOW_FUNCTION_LAST_VALUE",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

LAST_VALUE() 是一个窗口函数，用于返回窗口范围内的最后一个值。可以通过 IGNORE NULLS 或 RESPECT NULLS 选项来控制是否忽略空值。

## 语法

```sql
LAST_VALUE( <expr> ) [ { IGNORE | RESPECT } NULLS ]
    OVER ( [ PARTITION BY <partition_expr> ] ORDER BY <order_expr> [ ASC | DESC ] [ window_frame ] )
```

## 参数
| 参数                | 说明                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------- |
| expr                | 需要获取最后一个值的表达式                                                            |
| partition_by_clause | 可选。用于指定分区的列                                                                |
| order_by_clause     | 必需。用于指定排序的列                                                                |
| window_frame        | 可选。指定窗口框架。默认为 `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` |
| IGNORE NULLS        | 可选。设置后会忽略空值，返回最后一个非空值                                            |
| RESPECT NULLS       | 可选。默认值。如果最后一个值为空，则返回空值                                          |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

```sql
select * , 
last_value(`state`, 1) over(partition by `myday` order by `time_col` DESC rows between 1 preceding and 1 following) as ignore_null,
last_value(`state`, 0) over(partition by `myday` order by `time_col` DESC rows between 1 preceding and 1 following) as not_ignore_null,
last_value(`state`) over(partition by `myday` order by `time_col` DESC rows between 1 preceding and 1 following) as ignore_null_default
from t order by `id`, `myday`, `time_col`;
```

```text
+-----+-------+-------------+-------+-------------+-----------------+---------------------+
| id  | myday | time_col    | state | ignore_null | not_ignore_null | ignore_null_default |
| --- | ----- | ----------- | ----- | ----------- | --------------- | ------------------- |
| 1   | 21    | 04-21-11    | NULL  | 2           | NULL            | NULL                |
| 2   | 21    | 04-21-12    | 2     | 2           | NULL            | NULL                |
| 3   | 21    | 04-21-13    | 3     | 2           | 2               | 2                   |
| 4   | 22    | 04-22-10-21 | NULL  | NULL        | NULL            | NULL                |
| 5   | 22    | 04-22-10-22 | NULL  | 5           | NULL            | NULL                |
| 6   | 22    | 04-22-10-23 | 5     | 5           | NULL            | NULL                |
| 7   | 22    | 04-22-10-24 | NULL  | 5           | 5               | 5                   |
| 8   | 22    | 04-22-10-25 | 9     | 9           | NULL            | NULL                |
| 9   | 23    | 04-23-11    | NULL  | 10          | NULL            | NULL                |
| 10  | 23    | 04-23-12    | 10    | 10          | NULL            | NULL                |
| 11  | 23    | 04-23-13    | NULL  | 10          | 10              | 10                  |
| 12  | 24    | 02-24-10-21 | NULL  | NULL        | NULL            | NULL                |
+-----+-------+-------------+-------+-------------+-----------------+---------------------+
```

