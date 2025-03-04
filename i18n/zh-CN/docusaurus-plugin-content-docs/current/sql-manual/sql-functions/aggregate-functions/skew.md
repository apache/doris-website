---
{
    "title": "SKEW,SKEW_POP,SKEWNESS",
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

返回表达式的 [斜度](https://en.wikipedia.org/wiki/Skewness)。
用来计算斜度的公式是 `3阶中心矩 / ((方差)^{1.5})`, 当方差为零时，`SKEWNESS` 会返回 `NULL`。

**相关命令**

[kurt](./kurt.md)

## 别名

- SKEW
- SKEW_POP

## 语法

```sql
SKEWNESS(<col>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要被计算斜度的列 |

## 返回值

返回表达式的斜度， `Double` 类型。

## 举例
```sql
CREATE TABLE statistic_test(
    tag int, 
    val1 double not null, 
    val2 double null
) DISTRIBUTED BY HASH(tag)
PROPERTIES (
    "replication_num"="1"
);

INSERT INTO statistic_test VALUES
(1, -10, -10),
(2, -20, NULL),
(3, 100, NULL),
(4, 100, NULL),
(5, 1000,1000);

-- NULL 值会被忽略
SELECT 
  skew(val1), 
  skew(val2)
FROM statistic_test;
```

```text
+--------------------+------------+
| skew(val1)         | skew(val2) |
+--------------------+------------+
| 1.4337199628825619 |          0 |
+--------------------+------------+
```

```sql
-- 每组仅包含一行，结果为 NULL。
SELECT 
  skew(val1), 
  skew(val2) 
FROM statistic_test
GROUP BY tag;
```

```text
+------------+------------+
| skew(val1) | skew(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```