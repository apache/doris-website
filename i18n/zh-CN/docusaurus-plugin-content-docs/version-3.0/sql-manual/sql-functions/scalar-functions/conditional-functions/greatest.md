---
{
    "title": "GREATEST",
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

比较多个表达式的大小，并返回其中的最大值。如果任意参数为 `NULL`，则返回 `NULL`。

## 语法

```sql
GREATEST(<expr> [, ...])
```

## 参数

| 参数   | 描述 |
|------------|-------------|
| `<expr>`  | 需要比较的多个表达式，支持 `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`FLOAT`、`DOUBLE`、`STRING`、`DATETIME` 和 `DECIMAL` 类型。 |

## 返回值

- 返回给定表达式中的最大值。
- 如果任意参数为 `NULL`，则返回 `NULL`。

## 示例

```sql
SELECT GREATEST(-1, 0, 5, 8);
```

```text
+-----------------------+
| GREATEST(-1, 0, 5, 8) |
+-----------------------+
|                     8 |
+-----------------------+
```

```sql
SELECT GREATEST(-1, 0, 5, NULL);
```

```text
+--------------------------+
| GREATEST(-1, 0, 5, NULL) |
+--------------------------+
| NULL                     |
+--------------------------+
```

```sql
SELECT GREATEST(6.3, 4.29, 7.6876);
```

```text
+-----------------------------+
| GREATEST(6.3, 4.29, 7.6876) |
+-----------------------------+
|                      7.6876 |
+-----------------------------+
```

```sql
SELECT GREATEST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11');
```

```text
+-------------------------------------------------------------------------------+
| GREATEST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11') |
+-------------------------------------------------------------------------------+
| 2022-02-26 20:02:11                                                           |
+-------------------------------------------------------------------------------+
```