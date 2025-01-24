---
{
    "title": "VARIANCE,VAR_POP,VARIANCE_POP",
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

VARIANCE 函数计算指定表达式的统计方差。它衡量了数据值与其算术平均值之间的差异程度。

## 别名

- VAR_POP
- VARIANCE_POP

## 语法

```sql
VARIANCE(<expr>)
```

## 参数
| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要计算方差的列或表达式 |

## 返回值
返回一个 DOUBLE 类型的值，表示计算得到的方差。

## 举例
```sql
-- 创建示例表
CREATE TABLE student_scores (
    student_id INT,
    score DECIMAL(4,1)
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- 插入测试数据
INSERT INTO student_scores VALUES
(1, 85.5),
(2, 92.0),
(3, 78.5),
(4, 88.0),
(5, 95.5),
(6, 82.0),
(7, 90.0),
(8, 87.5);
-- 计算学生成绩的方差
SELECT VARIANCE(score) as score_variance
FROM student_scores;
```

```text
+-------------------+
| score_variance    |
+-------------------+
| 25.73437499999998 |
+-------------------+
```