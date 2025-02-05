---
{
    "title": "LEAST",
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

比较多个表达式的大小，返回其中的最小值。如果任意参数为 `NULL`，则返回 `NULL`。

## 语法

```sql
LEAST(<expr1>, <expr2>, ..., <exprN>)
```

## 参数

| 参数 | 描述 |
|------------|-------------|
| `<expr1>, <expr2>, ..., <exprN>` | 需要进行比较的表达式。支持的类型包括 `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`FLOAT`、`DOUBLE`、`STRING`、`DATETIME` 和 `DECIMAL`。 |

## 返回值

- 返回多个输入表达式中的最小值。
- 如果任意参数为 `NULL`，则返回 `NULL`。

## 示例

```sql
SELECT LEAST(-1, 0, 5, 8);
```

```text
+--------------------+
| LEAST(-1, 0, 5, 8) |
+--------------------+
|                 -1 |
+--------------------+
```

```sql
SELECT LEAST(-1, 0, 5, NULL);
```

```text
+-----------------------+
| LEAST(-1, 0, 5, NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```

```sql
SELECT LEAST(6.3, 4.29, 7.6876);
```

```text
+--------------------------+
| LEAST(6.3, 4.29, 7.6876) |
+--------------------------+
|                     4.29 |
+--------------------------+
```

```sql
SELECT LEAST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11');
```

```text
+----------------------------------------------------------------------------+
| LEAST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11') |
+----------------------------------------------------------------------------+
| 2020-01-23 20:02:11                                                        |
+----------------------------------------------------------------------------+
```