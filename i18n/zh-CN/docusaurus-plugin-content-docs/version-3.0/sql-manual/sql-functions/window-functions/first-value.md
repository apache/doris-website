---
{
    "title": "WINDOW_FUNCTION_FIRST_VALUE",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

FIRST_VALUE() 是一个窗口函数，用于返回窗口分区中有序数据集的第一个值。可以通过 IGNORE NULLS 或 RESPECT NULLS 选项来控制是否忽略空值。

## 语法

```sql
FIRST_VALUE( <expr> ) [ { IGNORE | RESPECT } NULLS ]
  OVER ( [ PARTITION BY <partition_expr> ] ORDER BY <order_expr> [ ASC | DESC ] [ window_frame ] )
```

## 参数
| 参数                | 说明                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| expr                | 需要获取第一个值的表达式                                                                |
| partition_by_clause | 可选。用于指定分区的列，格式为 `PARTITION BY column1, column2, ...`                     |
| order_by_clause     | 必需。用于指定排序的列，格式为 `ORDER BY column1 [ASC\|DESC], column2 [ASC\|DESC], ...` |
| IGNORE NULLS        | 可选。设置后会忽略空值，返回第一个非空值                                                |
| RESPECT NULLS       | 可选。默认值。如果第一个值为空，则返回空值                                              |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

```sql
SELECT 
    column1,
    column2,
    FIRST_VALUE(column2) OVER (
        PARTITION BY column1 
        ORDER BY column2 NULLS LAST
    ) AS column2_first
FROM VALUES
    (1, 10), (1, 11), (1, null), (1, 12),
    (2, 20), (2, 21), (2, 22)
ORDER BY column1, column2;
```

```text
+---------+---------+---------------+
| COLUMN1 | COLUMN2 | COLUMN2_FIRST |
|---------+---------+---------------|
|       1 |      10 |            10 |
|       1 |      11 |            10 |
|       1 |      12 |            10 |
|       1 |    NULL |            10 |
|       2 |      20 |            20 |
|       2 |      21 |            20 |
|       2 |      22 |            20 |
+---------+---------+---------------+
```