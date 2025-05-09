---
{
    "title": "NTH_VALUE",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

NTH_VALUE() 是一个窗口函数，用于返回窗口分区中有序数据集的第 N 个值，当 N 超出窗口有效大小时，返回结果 NULL。

## 语法

```sql
NTH_VALUE(<expr>, <offset>)
```

## 参数
| 参数                | 说明                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| expr                | 需要获取值的表达式                                                                |
| offset         | 参数 offset 的值为大于0的正整数，用于表示获取的第N的元素值，起始值从1开始                                              |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

```sql
WITH example_data AS (
    SELECT 1 as column1, 66 as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, 66, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, 66, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    NTH_VALUE(column2, 2) OVER (
        PARTITION BY column1 
        ORDER BY column2
        ROWS BETWEEN 1 preceding and 1 following
    ) as nth
FROM example_data
ORDER BY column1, column2;
```

```text
+------------+---------+---------+------+
| group_name | column1 | column2 | nth  |
+------------+---------+---------+------+
| A          |       1 |      10 |   20 |
| A          |       1 |      20 |   20 |
| A          |       1 |      66 |   66 |
| A          |       1 |      66 |   66 |
| B          |       2 |      30 |   40 |
| B          |       2 |      40 |   40 |
| B          |       2 |      66 |   66 |
+------------+---------+---------+------+
```