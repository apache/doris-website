---
{
    "title": "GROUP_CONCAT",
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

GROUP_CONCAT 函数将结果集中的多行结果连接成一个字符串

## 语法

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str>` | 必选。需要连接值的表达式 |
| `<sep>` | 可选。字符串之间的连接符号 |
| `<col_name>` | 可选。用于指定排序的列 |
| `<expr>` | 可选。用于指定排序的表达式 |

## 返回值

返回 VARCHAR 类型的数值。

## 举例

```sql
select value from test;
```

```text
+-------+
| value |
+-------+
| a     |
| b     |
| c     |
| c     |
+-------+
```

```sql
select GROUP_CONCAT(value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c, c            |
+-----------------------+
```

```sql
select GROUP_CONCAT(DISTINCT value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c               |
+-----------------------+
```

```sql 
select GROUP_CONCAT(value, " ") from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, ' ') |
+----------------------------+
| a b c c                    |
+----------------------------+
```

```sql
select GROUP_CONCAT(value, NULL) from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, NULL)|
+----------------------------+
| NULL                       |
+----------------------------+
```
