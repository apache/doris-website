---
{
    "title": "FIELD",
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

返回 `<expr>` 在参数列表中的位置（基于 1 的索引），常用于 `ORDER BY` 子句中实现自定义排序。如果 `<expr>` 不在参数列表中，或 `<expr>` 为 `NULL`，则返回 `0`。在自定义排序中，不在参数列表中的数据会被排到最前面，可通过 `asc` 或 `desc` 控制整体排序顺序；对于 `NULL` 值，可以使用 `nulls first` 或 `nulls last` 控制排序顺序。

## 语法

```sql
FIELD(<expr>, <param> [, ...])
```

## 参数

| 参数       | 说明                  |
|------------|-----------------------|
| `<expr>`   | 要搜索的值。         |
| `<param>`  | 用于比较的一系列值。 |

## 返回值

返回 `<expr>` 在 `<param>` 参数列表中的位置（基于 1 的索引）。如果 `<expr>` 不存在于参数列表中，或者 `<expr>` 为 `NULL`，则返回 `0`。

## 举例

```sql
SELECT k1, k7 FROM baseall WHERE k1 IN (1,2,3) ORDER BY FIELD(k1,2,1,3);
```

```text
+------+------------+
| k1   | k7         |
+------+------------+
|    2 | wangyu14   |
|    1 | wangjing04 |
|    3 | yuanyuan06 |
+------+------------+
```

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry');
```

```text
+------------+
| class_name |
+------------+
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') DESC;
```

```text
+------------+
| class_name |
+------------+
| Henry      |
| Henry      |
| Ben        |
| Ben        |
| Suzi       |
| Suzi       |
+------------+
```

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') NULLS FIRST;
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```