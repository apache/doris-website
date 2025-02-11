---
{
    "title": "NTILE",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

NTILE() 是一个窗口函数，用于将有序数据集平均分配到指定数量的桶中。桶的编号从 1 开始顺序编号，直到指定的桶数。当数据无法平均分配时，优先将多出的记录分配给编号较小的桶，使得各个桶中的行数最多相差 1。

## 语法

```sql
NTILE( <constant_value> )
```

## 参数
| 参数           | 说明                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ |
| constant_value | 必需。指定要分配的桶数量，必须是正整数                                               |

## 返回值

返回 BIGINT 类型的桶编号，范围从 1 到指定的桶数。

## 使用说明

如果语句中同时包含 NTILE 函数的 ORDER BY 子句和输出结果的 ORDER BY 子句，这两个排序是独立的：
- NTILE 函数的 ORDER BY 决定了行被分配到哪个桶中
- 输出的 ORDER BY 决定了结果的显示顺序

## 举例

```sql
SELECT 
    name,
    score,
    NTILE(4) OVER (ORDER BY score DESC) as quarter
FROM student_scores;
```

```text
+----------+-------+---------+
| name     | score | quarter |
+----------+-------+---------+
| Alice    | 98    | 1       |  -- 前 25% 的成绩
| Bob      | 95    | 1       |
| Charlie  | 90    | 2       |  -- 前 25-50% 的成绩
| David    | 85    | 2       |
| Eve      | 82    | 3       |  -- 前 50-75% 的成绩
| Frank    | 78    | 3       |
| Grace    | 75    | 4       |  -- 后 25% 的成绩
| Henry    | 70    | 4       |
+----------+-------+---------+
```
