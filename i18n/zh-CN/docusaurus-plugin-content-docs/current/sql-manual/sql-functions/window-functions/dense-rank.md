---
{
    "title": "WINDOW_FUNCTION_DENSE_RANK",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

DENSE_RANK() 是一种窗口函数，用于计算分组内值的排名，与 RANK() 不同的是，DENSE_RANK() 返回的排名是连续的，不会出现空缺数字。排名值从 1 开始按顺序递增，如果出现相同的值，它们将具有相同的排名。

## 语法

```sql
DENSE_RANK() OVER([ PARTITION BY <partition_expr> ] ORDER BY <order_expr> [ ASC | DESC ])
```

## 参数
| 参数                | 说明                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| partition_by_clause | 可选。用于指定分区的列，格式为 `PARTITION BY column1, column2, ...`。如果不指定，则将所有行视为一个分区     |
| order_by_clause     | 必需。用于指定排序的列，格式为 `ORDER BY column1 [ASC\|DESC], column2 [ASC\|DESC], ...`。这决定了排名的顺序 |

## 返回值

返回 BIGINT 类型的排名值，从 1 开始。

## 举例

```sql
select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 2    | -- 相同值具有相同排名 |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    | -- 排名连续，没有空缺 |
| 3   | 1   | 1    |
| 3   | 1   | 1    |
| 3   | 2   | 2    |
+-----+-----+------+
```