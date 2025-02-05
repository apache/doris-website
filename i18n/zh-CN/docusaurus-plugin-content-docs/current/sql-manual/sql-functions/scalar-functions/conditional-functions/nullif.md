---
{
    "title": "NULLIF",
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

如果两个输入值相等，则返回 `NULL`；否则返回第一个输入值。该函数等价于以下 `CASE WHEN` 表达式：

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```

## 语法

```sql
NULLIF(<expr1>, <expr2>)
```

## 参数

| 参数 | 说明 |
|-----------|-------------|
| `<expr1>` | 需要进行比较的第一个输入值。 |
| `<expr2>` | 需要与第一个输入值进行比较的第二个值。 |

## 返回值

- 如果 `<expr1>` 等于 `<expr2>`，则返回 `NULL`。
- 否则，返回 `<expr1>` 的值。

## 举例

```sql
SELECT NULLIF(1, 1);
```

```text
+--------------+
| NULLIF(1, 1) |
+--------------+
|         NULL |
+--------------+
```

```sql
SELECT NULLIF(1, 0);
```

```text
+--------------+
| NULLIF(1, 0) |
+--------------+
|            1 |
+--------------+
```