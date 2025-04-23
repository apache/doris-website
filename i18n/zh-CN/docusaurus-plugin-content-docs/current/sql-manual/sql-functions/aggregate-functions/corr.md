---
{
"title": "CORR",
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

计算两个随机变量的皮尔逊系数

## 语法

```sql
CORR(<expr1>, <expr2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 数值型表达式（列） |
| `<expr2>` | 数值型表达式（列） |

## 返回值

返回值为 DOUBLE 类型，expr1 和 expr2 的协方差，除 expr1 和 expr2 的标准差乘积，特殊情况：

- 如果 expr1 或 expr2 的标准差为 0, 将返回 0。
- 如果 expr1 或者 expr2 某一列为 NULL 时，该行数据不会被统计到最终结果中。

## 举例

```sql
select * from test_corr;
```

```text
+------+------+------+
| id   | k1   | k2   |
+------+------+------+
|    1 |   20 |   22 |
|    1 |   10 |   20 |
|    2 |   36 |   21 |
|    2 |   30 |   22 |
|    2 |   25 |   20 |
|    3 |   25 | NULL |
|    4 |   25 |   21 |
|    4 |   25 |   22 |
|    4 |   25 |   20 |
+------+------+------+
```

```sql
select id,corr(k1,k2) from test_corr group by id;
```

```text
+------+--------------------+
| id   | corr(k1, k2)       |
+------+--------------------+
|    4 |                  0 |
|    1 |                  1 |
|    3 |               NULL |
|    2 | 0.4539206495016019 |
+------+--------------------+
```

