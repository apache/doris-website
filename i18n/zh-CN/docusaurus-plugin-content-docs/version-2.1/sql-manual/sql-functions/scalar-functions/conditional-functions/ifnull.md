---
{
    "title": "IFNULL",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under 一
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

如果 `<expr1>` 的值不为 `NULL`，则返回 `<expr1>`；否则返回 `<expr2>`。

## 别名

- NVL

## 语法

```sql
IFNULL(<expr1>, <expr2>)
```

## 参数

| 参数       | 描述 |
|------------|------|
| `<expr1>`  | 需要判断是否为 `NULL` 的表达式。 |
| `<expr2>`  | `<expr1>` 为 `NULL` 时返回的值。 |

## 返回值

- 如果 `<expr1>` 不为 `NULL`，则返回 `<expr1>`。  
- 否则，返回 `<expr2>`。

## 举例

```sql
SELECT IFNULL(1, 0);
```

```text
+--------------+
| IFNULL(1, 0) |
+--------------+
|            1 |
+--------------+
```

```sql
SELECT IFNULL(NULL, 10);
```

```text
+------------------+
| IFNULL(NULL, 10) |
+------------------+
|               10 |
+------------------+
```